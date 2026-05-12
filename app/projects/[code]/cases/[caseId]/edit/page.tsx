// (Phase 4) หน้า Form แก้ไข Test Case
"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  X,
  ChevronDown,
  Beaker,
  AlertCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types matching our Prisma Schema ---

type Severity = "BLOCKER" | "CRITICAL" | "MAJOR" | "NORMAL" | "MINOR" | "TRIVIAL";
type Priority = "HIGH" | "MEDIUM" | "LOW";
type AutomationStatus = "MANUAL" | "TO_BE_AUTOMATED" | "AUTOMATED";

interface TestStepInput {
  action: string;
  expectedResult: string;
}

interface TestCaseFormValues {
  title: string;
  description: string;
  preconditions: string;
  severity: Severity;
  priority: Priority;
  automationStatus: AutomationStatus;
  steps: TestStepInput[];
  customFields: Record<string, any>;
}

export default function TestCaseEditor() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestCaseFormValues>({
    defaultValues: {
      title: "",
      severity: "NORMAL",
      priority: "MEDIUM",
      automationStatus: "MANUAL",
      steps: [{ action: "", expectedResult: "" }], // Start with one empty step
      customFields: {},
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const [isSharedStepsModalOpen, setIsSharedStepsModalOpen] = React.useState(false);
  const [sharedStepsList, setSharedStepsList] = React.useState<any[]>([]);

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

  const params = useParams();
  const caseId = params.caseId;
  const projectCode = params.code as string;

  const [customFieldsDef, setCustomFieldsDef] = React.useState<any[]>([]);

  useEffect(() => {
    if (!projectCode) return;

    fetch("/api/workspace/fields")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const relevantFields = data.filter((f: any) => {
            if (f.isSystem) return false;
            if (f.projects === 'All projects') return true;
            if (f.projectCodes && f.projectCodes.includes(projectCode)) return true;
            return false;
          });
          setCustomFieldsDef(relevantFields);
        }
      })
      .catch(console.error);
  }, [projectCode]);

  useEffect(() => {
    if (!caseId) return;

    const loadData = async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
          const data = await res.json();
          reset({
            title: data.title,
            severity: data.severity || "NORMAL",
            priority: data.priority || "MEDIUM",
            automationStatus: data.automationStatus || "MANUAL",
            preconditions: data.preconditions || "",
            description: data.description || "",
            steps: data.steps && data.steps.length > 0 ? data.steps : [{ action: "", expectedResult: "" }],
            customFields: data.customFields || {}
          });
        } else {
          handleFallback();
        }
      } catch (err) {
        console.error("Failed to fetch, using dummy data", err);
        handleFallback();
      }
    };

    const handleFallback = () => {
      reset({
        title: "Verify successful login",
        severity: "MAJOR",
        priority: "HIGH",
        automationStatus: "MANUAL",
        preconditions: "User must have a registered account",
        description: "",
        steps: [
          { action: "Navigate to login page", expectedResult: "Login page loads" },
          { action: "Enter valid credentials", expectedResult: "Inputs are filled" },
          { action: "Click submit", expectedResult: "User is logged in and redirected to dashboard" }
        ],
        customFields: {}
      });
    };

    loadData();
  }, [caseId, reset]);

  const onSubmit = async (data: TestCaseFormValues) => {
    console.log("Saving Test Case Edits:", data);
    try {
      const res = await fetch(`/api/cases/${caseId}`, { 
        method: 'PATCH', 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          steps: data.steps.map((s, i) => ({ ...s, position: i }))
        }) 
      });
      if (res.ok) {
        alert("Test case updated successfully!");
        router.back();
      } else {
        alert("Failed to update");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-slate-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">Edit test case {caseId}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4 space-y-6">
        {/* Basic Information Card */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="e.g., User can complete checkout with Credit Card"
              className={cn(
                "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                errors.title ? "border-red-500" : "border-slate-200"
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Severity */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                <AlertCircle size={14} className="mr-1.5 text-slate-400" /> Severity
              </label>
              <select
                {...register("severity")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
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
              <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                <Zap size={14} className="mr-1.5 text-slate-400" /> Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Automation */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                <Beaker size={14} className="mr-1.5 text-slate-400" /> Automation
              </label>
              <select
                {...register("automationStatus")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="MANUAL">Manual</option>
                <option value="TO_BE_AUTOMATED">To be automated</option>
                <option value="AUTOMATED">Automated</option>
              </select>
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldsDef.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Custom Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFieldsDef.map(field => (
                  <div key={field.id} className={field.type === 'TEXT' ? "col-span-1 md:col-span-2" : ""}>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      {field.name} {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'SELECT' && (
                      <select
                        {...register(`customFields.${field.id}`, { required: field.isRequired ? "Required" : false })}
                        className={cn(
                          "w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer transition-all",
                          errors?.customFields?.[field.id] ? "border-red-500" : "border-slate-200"
                        )}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt: any) => (
                          <option key={opt.id} value={opt.value}>{opt.value}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'STRING' && (
                      <input
                        type="text"
                        {...register(`customFields.${field.id}`, { required: field.isRequired ? "Required" : false })}
                        className={cn(
                          "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                          errors?.customFields?.[field.id] ? "border-red-500" : "border-slate-200"
                        )}
                      />
                    )}
                    {field.type === 'TEXT' && (
                      <textarea
                        {...register(`customFields.${field.id}`, { required: field.isRequired ? "Required" : false })}
                        rows={3}
                        className={cn(
                          "w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y",
                          errors?.customFields?.[field.id] ? "border-red-500" : "border-slate-200"
                        )}
                      />
                    )}
                    {field.type === 'CHECKBOX' && (
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          {...register(`customFields.${field.id}`, { required: field.isRequired ? "Required" : false })}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    {errors?.customFields?.[field.id] && (
                      <p className="mt-1 text-xs text-red-500">{errors.customFields[field.id]?.message as string}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Test Steps Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Test Steps</h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {fields.length} {fields.length === 1 ? 'Step' : 'Steps'}
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="group bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex"
              >
                {/* Drag Handle & Number */}
                <div className="w-12 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 space-y-2">
                  <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                  <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                </div>

                {/* Step Inputs */}
                <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Action</label>
                    <textarea
                      {...register(`steps.${index}.action` as const, { required: true })}
                      rows={2}
                      placeholder="Step description..."
                      className="w-full px-3 py-2 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-50 rounded-md outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Result</label>
                    <textarea
                      {...register(`steps.${index}.expectedResult` as const)}
                      rows={2}
                      placeholder="What should happen?"
                      className="w-full px-3 py-2 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-50 rounded-md outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Delete Action */}
                <div className="w-12 flex items-center justify-center pr-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
              className="flex-1 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center font-medium text-sm"
            >
              <Plus size={18} className="mr-2" />
              Add step
            </button>
            <button
              type="button"
              onClick={openSharedStepsModal}
              className="flex-1 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center font-medium text-sm"
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
              <h3 className="text-lg font-bold text-text-main">Insert Shared Step</h3>
              <button type="button" onClick={() => setIsSharedStepsModalOpen(false)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[400px]">
              {sharedStepsList.length === 0 ? (
                <div className="text-center py-10 text-text-muted">No shared steps available. Create them in project settings.</div>
              ) : (
                <div className="space-y-3">
                  {sharedStepsList.map(step => (
                    <div key={step.id} className="p-4 border border-border rounded-lg flex justify-between items-center bg-background hover:border-primary/50 transition-colors">
                      <div className="mr-4 overflow-hidden">
                        <div className="font-bold text-text-main truncate">{step.title}</div>
                        <div className="text-sm text-text-muted mt-1 truncate">{step.action}</div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          append({ action: step.action, expectedResult: step.expectedResult || "" });
                          setIsSharedStepsModalOpen(false);
                        }}
                        className="px-4 py-2 bg-primary hover:bg-blue-700 transition-colors text-white text-sm font-medium rounded-md shadow-sm shrink-0"
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