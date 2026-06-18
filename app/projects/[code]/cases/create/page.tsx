// (Phase 4) หน้า Form สร้าง Test Case
"use client";

export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  X,
  ChevronDown,
  Beaker,
  AlertCircle,
  Zap,
  FileIcon,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/ui/FileUpload";

// --- Types matching our Prisma Schema ---

type Severity =
  | "BLOCKER"
  | "CRITICAL"
  | "MAJOR"
  | "NORMAL"
  | "MINOR"
  | "TRIVIAL";
type Priority = "HIGH" | "MEDIUM" | "LOW";
type AutomationStatus = "MANUAL" | "TO_BE_AUTOMATED" | "AUTOMATED";

interface TestStepInput {
  action: string;
  expectedResult: string;
}

interface TestCaseFormValues {
  title: string;
  suiteId: string;
  description: string;
  preconditions: string;
  severity: Severity;
  priority: Priority;
  automationStatus: AutomationStatus;
  tagsInput: string;
  steps: TestStepInput[];
  customFields: Record<string, any>;
}

function CreateCaseContent({
  params,
}: {
  params: any; /* use React.use() if async in Next15, but it's client comp here */
}) {
  // We need to extract projectCode. In a true client comp, we might get it from useParams() or pass it as prop.
  // For now, we will extract it from the URL since params might be a Promise in Next.js 15.
  const [projectCode, setProjectCode] = useState("");

  React.useEffect(() => {
    // hack to get code from url
    const pathParts = window.location.pathname.split("/");
    const codeIdx = pathParts.indexOf("projects") + 1;
    if (pathParts[codeIdx]) {
      const code = pathParts[codeIdx];
      setProjectCode(code);
      fetch(`/api/projects/${code}/suites`)
        .then((res) => res.json())
        .then(setSuites);
    }
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSuiteId = searchParams.get("suite");

  const [attachments, setAttachments] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [customFieldsDef, setCustomFieldsDef] = useState<any[]>([]);

  React.useEffect(() => {
    if (!projectCode) return;

    fetch("/api/workspace/fields")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const relevantFields = data.filter((f: any) => {
            if (f.isSystem) return false;
            if (f.projects === "All projects") return true; // It's global
            if (f.projectCodes && f.projectCodes.includes(projectCode))
              return true;
            return false;
          });
          setCustomFieldsDef(relevantFields);
        }
      })
      .catch(console.error);
  }, [projectCode]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TestCaseFormValues>({
    defaultValues: {
      title: "",
      suiteId: initialSuiteId || "",
      severity: "NORMAL",
      priority: "MEDIUM",
      automationStatus: "MANUAL",
      tagsInput: "",
      steps: [{ action: "", expectedResult: "" }], // Start with one empty step
      customFields: {},
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const [isSharedStepsModalOpen, setIsSharedStepsModalOpen] = useState(false);
  const [sharedStepsList, setSharedStepsList] = useState<any[]>([]);

  const openSharedStepsModal = async () => {
    try {
      const res = await fetch(`/api/projects/${projectCode}/shared-steps`);
      if (res.ok) {
        setSharedStepsList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setIsSharedStepsModalOpen(true);
  };

  const onSubmit = async (data: TestCaseFormValues) => {
    const tags = data.tagsInput
      ? data.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    const payload = {
      ...data,
      steps: data.steps.map((step, idx) => ({ ...step, position: idx })),
      tags,
      attachmentIds: attachments.map((a) => a.id),
    };

    console.log("Submitting Test Case:", payload);
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Test case created");
        router.push(`/projects/${projectCode}/repository`);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "Failed to save test case");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving test case");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full overflow-y-auto w-full bg-surface-hover pb-20"
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-hover rounded-full transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
          <h1 className="text-xl font-semibold text-text-main">
            Create test case
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Save size={16} className="mr-2" />
            Save Case
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4 space-y-6">
        {/* Basic Information Card */}
        <section className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                Title
              </label>
              <input
                {...register("title", { required: "Title is required" })}
                placeholder="e.g., User can complete checkout with Credit Card"
                className={cn(
                  "w-full px-4 py-2.5 bg-surface-hover border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                  errors.title ? "border-red-500" : "border-border",
                )}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-text-main mb-2">
                <Folder size={14} className="mr-1.5 text-text-muted" /> Suite
              </label>
              <select
                {...register("suiteId", { required: "Suite is required" })}
                className={cn(
                  "w-full px-3 py-2.5 bg-surface-hover border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer transition-all",
                  errors.suiteId ? "border-red-500" : "border-border",
                )}
              >
                <option value="" disabled>
                  Select a Suite...
                </option>
                {suites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              {errors.suiteId && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.suiteId.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Tags (comma separated)
            </label>
            <input
              {...register("tagsInput")}
              placeholder="e.g., login, api, smoke"
              className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Severity */}
            <div>
              <label className="flex items-center text-sm font-semibold text-text-main mb-2">
                <AlertCircle size={14} className="mr-1.5 text-text-muted" />{" "}
                Severity
              </label>
              <select
                {...register("severity")}
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="NORMAL">Normal</option>
                <option value="MINOR">Minor</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center text-sm font-semibold text-text-main mb-2">
                <Zap size={14} className="mr-1.5 text-text-muted" /> Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Automation */}
            <div>
              <label className="flex items-center text-sm font-semibold text-text-main mb-2">
                <Beaker size={14} className="mr-1.5 text-text-muted" />{" "}
                Automation
              </label>
              <select
                {...register("automationStatus")}
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="MANUAL">Manual</option>
                <option value="TO_BE_AUTOMATED">To be automated</option>
                <option value="AUTOMATED">Automated</option>
              </select>
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldsDef.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-text-main mb-4">
                Custom Fields
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFieldsDef.map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.type === "TEXT" ? "col-span-1 md:col-span-2" : ""
                    }
                  >
                    <label className="flex items-center text-sm font-semibold text-text-main mb-2">
                      {field.name}{" "}
                      {field.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {field.type === "SELECT" && (
                      <select
                        {...register(`customFields.${field.id}`, {
                          required: field.isRequired ? "Required" : false,
                        })}
                        className={cn(
                          "w-full px-3 py-2 bg-surface-hover border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer transition-all",
                          errors?.customFields?.[field.id]
                            ? "border-red-500"
                            : "border-border",
                        )}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt: any) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    )}
                    {field.type === "STRING" && (
                      <input
                        type="text"
                        {...register(`customFields.${field.id}`, {
                          required: field.isRequired ? "Required" : false,
                        })}
                        className={cn(
                          "w-full px-4 py-2.5 bg-surface-hover border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                          errors?.customFields?.[field.id]
                            ? "border-red-500"
                            : "border-border",
                        )}
                      />
                    )}
                    {field.type === "TEXT" && (
                      <textarea
                        {...register(`customFields.${field.id}`, {
                          required: field.isRequired ? "Required" : false,
                        })}
                        rows={3}
                        className={cn(
                          "w-full px-4 py-2.5 bg-surface-hover border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y",
                          errors?.customFields?.[field.id]
                            ? "border-red-500"
                            : "border-border",
                        )}
                      />
                    )}
                    {field.type === "CHECKBOX" && (
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          {...register(`customFields.${field.id}`, {
                            required: field.isRequired ? "Required" : false,
                          })}
                          className="w-4 h-4 rounded border-text-muted text-primary focus:ring-blue-500"
                        />
                      </div>
                    )}
                    {errors?.customFields?.[field.id] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.customFields[field.id]?.message as string}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Attachments
            </label>
            <FileUpload
              projectId={projectCode}
              onUploadComplete={(attachment) =>
                setAttachments((prev) => [...prev, attachment])
              }
            />
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-surface-hover border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-primary rounded flex items-center justify-center">
                        <FileIcon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-main truncate max-w-[200px]">
                          {file.originalName}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((a) => a.id !== file.id),
                        )
                      }
                      className="p-1.5 text-text-muted hover:text-red-500 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Test Steps Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main">Test Steps</h2>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {fields.length} {fields.length === 1 ? "Step" : "Steps"}
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="group bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex"
              >
                {/* Drag Handle & Number */}
                <div className="w-12 bg-surface-hover border-r border-border flex flex-col items-center py-4 space-y-2">
                  <GripVertical
                    size={16}
                    className="text-text-muted cursor-grab active:cursor-grabbing"
                  />
                  <span className="text-xs font-bold text-text-muted">
                    {index + 1}
                  </span>
                </div>

                {/* Step Inputs */}
                <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      Action
                    </label>
                    <textarea
                      {...register(`steps.${index}.action` as const, {
                        required: true,
                      })}
                      rows={2}
                      placeholder="Step description..."
                      className="w-full px-3 py-2 text-sm bg-transparent border border-transparent hover:border-border focus:border-blue-500 focus:bg-surface-hover rounded-md outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      Expected Result
                    </label>
                    <textarea
                      {...register(`steps.${index}.expectedResult` as const)}
                      rows={2}
                      placeholder="What should happen?"
                      className="w-full px-3 py-2 text-sm bg-transparent border border-transparent hover:border-border focus:border-blue-500 focus:bg-surface-hover rounded-md outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Delete Action */}
                <div className="w-12 flex items-center justify-center pr-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-text-muted hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={() => append({ action: "", expectedResult: "" })}
              className="flex-1 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-blue-400 hover:text-primary hover:bg-blue-50/50 transition-all flex items-center justify-center font-medium text-sm"
            >
              <Plus size={18} className="mr-2" />
              Add step
            </button>
            <button
              type="button"
              onClick={openSharedStepsModal}
              className="flex-1 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-blue-400 hover:text-primary hover:bg-blue-50/50 transition-all flex items-center justify-center font-medium text-sm"
            >
              <Plus size={18} className="mr-2" />
              Insert Shared Step
            </button>
          </div>
        </section>
      </main>

      {isSharedStepsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[600px] rounded-lg shadow-xl overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold text-text-main">
                Insert Shared Step
              </h3>
              <button
                type="button"
                onClick={() => setIsSharedStepsModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[400px]">
              {sharedStepsList.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  No shared steps available. Create them in project settings.
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedStepsList.map((step) => (
                    <div
                      key={step.id}
                      className="p-4 border border-border rounded-lg flex justify-between items-center bg-background hover:border-primary/50 transition-colors"
                    >
                      <div className="mr-4 overflow-hidden">
                        <div className="font-bold text-text-main truncate">
                          {step.title}
                        </div>
                        <div className="text-sm text-text-muted mt-1 truncate">
                          {step.action}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          append({
                            action: step.action,
                            expectedResult: step.expectedResult || "",
                          });
                          setIsSharedStepsModalOpen(false);
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover transition-colors text-primary-foreground text-sm font-medium rounded-md shadow-sm shrink-0"
                      >
                        Insert
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default function CreateCasePage({ params }: { params: any }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCaseContent params={params} />
    </Suspense>
  );
}
