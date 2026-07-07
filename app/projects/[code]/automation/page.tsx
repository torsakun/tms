"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "sonner";
import {
  Plus,
  Sparkles,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  Zap,
  Play,
  Trash2,
  CalendarClock,
  ChevronDown,
  Check,
  Clock,
  PlayCircle,
  XCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

type AutomationCase = {
  id: string;
  automationStatus: string;
  automationScript?: string | null;
};

type TestPlanOption = {
  id: string;
  title: string;
};

type Pipeline = {
  id: string;
  title: string;
  cron: string;
  isActive: boolean;
  plan?: TestPlanOption | null;
  lastRun?: {
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    passRate: number | null;
  } | null;
};

type ApiResponse = {
  error?: string;
  prUrl?: string;
  isActive?: boolean;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AutomationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [cases, setCases] = useState<AutomationCase[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"IDLE" | "GENERATING" | "READY_TO_PUSH" | "PUSHING" | "DONE">("IDLE");
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [testPlans, setTestPlans] = useState<TestPlanOption[]>([]);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [newPipelineTitle, setNewPipelineTitle] = useState("Nightly regression");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [cron, setCron] = useState("0 2 * * *");
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [creatingPipeline, setCreatingPipeline] = useState(false);
  const [pipelineAction, setPipelineAction] = useState<{
    id: string;
    type: "toggle" | "run" | "delete";
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [code]);

  const fetchData = async () => {
    fetch(`/api/projects/${code}/cases`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cases = data as AutomationCase[];
          const manualCases = cases.filter((c) => c.automationStatus === "MANUAL");
          const toBeAutomatedCases = cases.filter((c) => c.automationStatus === "TO_BE_AUTOMATED");

          const combined = [...toBeAutomatedCases, ...manualCases];
          setCases(combined);
          setSelectedCaseIds(manualCases.map((c) => c.id));
        }
      });

    fetch(`/api/projects/${code}/pipelines`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPipelines(data as Pipeline[]);
        }
      });

    fetch(`/api/projects/${code}/plans`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const plans = data as TestPlanOption[];
          setTestPlans(plans);
          setSelectedPlanId((current) => current || data[0]?.id || "");
        }
      });
  };

  const handleGenerate = async () => {
    if (selectedCaseIds.length === 0) return;
    setStatus("GENERATING");
    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: selectedCaseIds }),
      });
      if (!res.ok) throw new Error("Generation failed");
      setStatus("IDLE");
      fetchData();
      toast.success("Scripts generated successfully");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Generation failed"));
      setStatus("IDLE");
    }
  };

  const handlePushToGithub = async () => {
    const pendingCases = cases.filter((c) => c.automationStatus === "TO_BE_AUTOMATED").map((c) => c.id);
    if (pendingCases.length === 0) return;

    setStatus("PUSHING");
    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-github-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: pendingCases }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error);

      setPrUrl(data.prUrl || null);
      setStatus("DONE");
      fetchData();
      toast.success("Successfully pushed to GitHub!");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to push to GitHub"));
      setStatus("IDLE");
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineTitle.trim() || !selectedPlanId) return;
    setCreatingPipeline(true);
    try {
      const res = await fetch(`/api/projects/${code}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPipelineTitle,
          cron,
          planId: selectedPlanId,
          activateImmediately,
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || "Failed to create pipeline");

      setIsPipelineModalOpen(false);
      setNewPipelineTitle("Nightly regression");
      setSelectedPlanId(testPlans[0]?.id || "");
      setCron("0 2 * * *");
      setActivateImmediately(true);
      fetchData();
      toast.success("Pipeline created");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to create pipeline"));
    } finally {
      setCreatingPipeline(false);
    }
  };

  const handleTogglePipeline = async (pipeline: Pipeline) => {
    setPipelineAction({ id: pipeline.id, type: "toggle" });
    try {
      const res = await fetch(`/api/projects/${code}/pipelines/${pipeline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pipeline.isActive }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || "Failed to update pipeline");

      const nextIsActive = data.isActive ?? !pipeline.isActive;
      setPipelines((current) =>
        current.map((item) =>
          item.id === pipeline.id ? { ...item, isActive: nextIsActive } : item,
        ),
      );
      toast.success(nextIsActive ? "Pipeline activated" : "Pipeline paused");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to update pipeline"));
    } finally {
      setPipelineAction(null);
    }
  };

  const handleRunPipeline = async (pipeline: Pipeline) => {
    setPipelineAction({ id: pipeline.id, type: "run" });
    try {
      const res = await fetch(
        `/api/projects/${code}/pipelines/${pipeline.id}/trigger`,
        { method: "POST" },
      );
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || "Failed to run pipeline");

      fetchData();
      toast.success("Pipeline run started");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to run pipeline"));
    } finally {
      setPipelineAction(null);
    }
  };

  const handleDeletePipeline = async (pipeline: Pipeline) => {
    setPipelineAction({ id: pipeline.id, type: "delete" });
    try {
      const res = await fetch(`/api/projects/${code}/pipelines/${pipeline.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || "Failed to delete pipeline");

      setPipelines((current) => current.filter((item) => item.id !== pipeline.id));
      toast.success("Pipeline deleted");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to delete pipeline"));
    } finally {
      setPipelineAction(null);
    }
  };

  const formatRelativeTime = (value?: string | Date | null) => {
    if (!value) return "No runs yet";
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return "just now";
    if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))} min ago`;
    if (diffMs < day) return `${Math.round(diffMs / hour)} h ago`;
    return `${Math.round(diffMs / day)} d ago`;
  };

  const lastRunIcon = (pipeline: Pipeline): { Icon: LucideIcon; className: string; text: string } => {
    if (!pipeline.lastRun) {
      return {
        Icon: Clock,
        className: "text-text-faint",
        text: "No runs yet",
      };
    }
    if (pipeline.lastRun.status === "ACTIVE") {
      return {
        Icon: PlayCircle,
        className: "text-primary",
        text: formatRelativeTime(pipeline.lastRun.createdAt),
      };
    }
    if (pipeline.lastRun.status === "ABORTED") {
      return {
        Icon: XCircle,
        className: "text-danger",
        text: formatRelativeTime(pipeline.lastRun.updatedAt),
      };
    }
    return {
      Icon:
        pipeline.lastRun.passRate !== null && pipeline.lastRun.passRate < 80
          ? AlertCircle
          : CheckCircle2,
      className:
        pipeline.lastRun.passRate !== null && pipeline.lastRun.passRate < 80
          ? "text-warning"
          : "text-pass",
      text: `${formatRelativeTime(pipeline.lastRun.updatedAt)}${
        pipeline.lastRun.passRate !== null
          ? ` · ${pipeline.lastRun.passRate}%`
          : ""
      }`,
    };
  };

  const pendingCasesCount = cases.filter(c => c.automationStatus === "TO_BE_AUTOMATED").length;

  return (
    <div className="w-full max-w-[1120px] mx-auto p-[20px_22px] antialiased font-sans pb-20">
      
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">Automation</div>
          <div className="text-[13px] text-text-muted mt-[2px]">Scheduled pipelines and CI integration</div>
        </div>
        <div className="flex-1" />
        <button 
          onClick={() => setIsPipelineModalOpen(true)}
          className="flex items-center gap-[6px] h-[36px] px-[16px] bg-primary text-white text-[13px] font-semibold rounded-[9px] hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create scheduled pipeline
        </button>
      </div>

      {/* two action panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[22px]">
        <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm flex gap-[14px] items-start">
          <div className="w-[40px] h-[40px] rounded-[11px] bg-primary-soft text-primary-text flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold text-text-main">Generate automation</div>
            <div className="text-[12.5px] text-text-muted m-[4px_0_13px] leading-[1.5]">Turn manual cases in this suite into runnable test scaffolds.</div>
            <button 
              onClick={handleGenerate}
              disabled={status !== "IDLE" || selectedCaseIds.length === 0}
              className="h-[36px] px-[14px] bg-primary text-white text-[13px] font-semibold rounded-[9px] hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-[6px] disabled:opacity-50"
            >
              {status === "GENERATING" ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {status === 'GENERATING' ? 'Generating...' : 'Generate scripts'}
            </button>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm flex gap-[14px] items-start">
          <div className="w-[40px] h-[40px] rounded-[11px] bg-surface-2 text-text-main flex items-center justify-center shrink-0">
            <GitPullRequest size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold text-text-main">Push to GitHub</div>
            <div className="text-[12.5px] text-text-muted m-[4px_0_13px] leading-[1.5]">Open a pull request with the generated suite in your repo.</div>
            
            {status === "PUSHING" ? (
              <div className="inline-flex items-center gap-[8px] h-[36px] px-[16px] rounded-[9px] bg-surface shadow-[inset_0_0_0_1px_var(--border-strong)] text-[13px] font-semibold text-text-muted">
                <span className="w-[14px] h-[14px] rounded-full border-2 border-border-strong border-t-primary animate-[spin_0.7s_linear_infinite]" />
                Opening PR...
              </div>
            ) : status === "DONE" && prUrl ? (
              <a href={prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[6px] h-[36px] px-[14px] bg-pass text-white text-[13px] font-semibold rounded-[9px] hover:bg-pass/90 transition-colors shadow-sm">
                <CheckCircle2 size={18} />
                View PR
              </a>
            ) : (
              <button 
                onClick={handlePushToGithub}
                disabled={pendingCasesCount === 0 || status !== "IDLE"}
                className="h-[36px] px-[14px] bg-surface text-text-main text-[13px] font-semibold rounded-[9px] shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-surface-hover transition-colors flex items-center gap-[6px] disabled:opacity-50"
              >
                <GitPullRequest size={18} />
                Push to GitHub
              </button>
            )}
          </div>
        </div>
      </div>

      {/* pipelines table */}
      <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_90px_130px_70px] gap-[14px] p-[10px_18px] text-[10.5px] font-semibold tracking-[0.06em] uppercase text-text-faint border-b border-border bg-surface-hover/30">
          <div>Pipeline</div>
          <div>Schedule</div>
          <div>State</div>
          <div>Last run</div>
          <div></div>
        </div>
        
        {pipelines.map(p => {
          const runState = lastRunIcon(p);
          const isToggling = pipelineAction?.id === p.id && pipelineAction?.type === "toggle";
          const isRunning = pipelineAction?.id === p.id && pipelineAction?.type === "run";
          const isDeleting = pipelineAction?.id === p.id && pipelineAction?.type === "delete";

          return (
          <div key={p.id} className="grid grid-cols-[1.6fr_1fr_90px_130px_70px] gap-[14px] p-[13px_18px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-[11px] min-w-0">
              <div className="w-[32px] h-[32px] rounded-[9px] bg-surface-2 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-text-muted" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text-main truncate">{p.title}</div>
                <div className="text-[11px] text-text-faint truncate">
                  {p.plan?.title || "All automated cases"}
                </div>
              </div>
            </div>
            <div className="font-mono text-[11.5px] text-text-muted">{p.cron}</div>
            <div>
              <button
                type="button"
                disabled={isToggling || isDeleting}
                onClick={() => handleTogglePipeline(p)}
                aria-label={p.isActive ? "Pause pipeline" : "Activate pipeline"}
                className={`w-[34px] h-[20px] rounded-full relative cursor-pointer transition-colors disabled:opacity-60 ${p.isActive ? 'bg-primary' : 'bg-surface-2'}`}
              >
                <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all ${p.isActive ? 'right-[2px]' : 'left-[2px]'}`} />
              </button>
            </div>
            <div className="flex items-center gap-[6px] text-[12px]">
              <runState.Icon size={14} className={runState.className} />
              <span className="text-text-muted truncate">{runState.text}</span>
            </div>
            <div className="flex gap-[3px] justify-end">
              <button
                onClick={() => handleRunPipeline(p)}
                disabled={!p.isActive || isRunning || isDeleting}
                className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-primary hover:bg-primary-soft transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                title={p.isActive ? "Run now" : "Activate pipeline before running"}
              >
                {isRunning ? <RefreshCw size={17} className="animate-spin" /> : <Play size={17} />}
              </button>
              <button
                onClick={() => handleDeletePipeline(p)}
                disabled={isDeleting || isRunning || isToggling}
                className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-text-faint hover:bg-danger-soft hover:text-danger transition-colors disabled:opacity-40"
                title="Delete pipeline"
              >
                {isDeleting ? <RefreshCw size={17} className="animate-spin" /> : <Trash2 size={17} />}
              </button>
            </div>
          </div>
          );
        })}

        {pipelines.length === 0 && (
          <div className="p-8 text-center text-[13px] text-text-muted">No scheduled pipelines found.</div>
        )}
      </div>

      {/* create pipeline modal */}
      {isPipelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[64px]" style={{ background: "color(display-p3 0 0 0 / 0.4)" }} onClick={() => setIsPipelineModalOpen(false)}>
          <div 
            className="w-[440px] bg-surface border border-border rounded-[15px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-[10px] p-[18px_20px_0]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-soft text-primary-text flex items-center justify-center">
                <CalendarClock size={19} />
              </div>
              <div className="text-[15.5px] font-semibold text-text-main">New scheduled pipeline</div>
            </div>
            
            <div className="p-[16px_20px] flex flex-col gap-[14px]">
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Name</label>
                <div className="flex items-center h-[40px] px-[13px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <input type="text" value={newPipelineTitle} onChange={(e) => setNewPipelineTitle(e.target.value)} className="w-full bg-transparent outline-none text-text-main" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="block text-[12px] text-text-muted mb-[6px]">Test plan</label>
                  <div className="relative flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      disabled={testPlans.length === 0}
                      className="w-full appearance-none bg-transparent outline-none text-text-main disabled:text-text-faint"
                    >
                      {testPlans.length === 0 ? (
                        <option value="">No test plans</option>
                      ) : (
                        testPlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.title}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown size={17} className="pointer-events-none absolute right-[12px] text-text-faint" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-text-muted mb-[6px]">Cron</label>
                  <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_2px_var(--ring)] text-[12.5px] font-mono focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                    <input type="text" value={cron} onChange={(e) => setCron(e.target.value)} className="w-full bg-transparent outline-none text-text-main" />
                  </div>
                </div>
              </div>
              <div 
                className="flex items-center gap-[9px] p-[11px_12px] bg-surface-2 rounded-[10px] cursor-pointer"
                onClick={() => setActivateImmediately(!activateImmediately)}
              >
                <div className={`w-[34px] h-[20px] rounded-full relative transition-colors ${activateImmediately ? 'bg-primary' : 'bg-surface-hover border border-border'}`}>
                  <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all ${activateImmediately ? 'right-[2px]' : 'left-[2px]'}`} />
                </div>
                <span className="text-[12.5px] font-medium text-text-main">Activate immediately</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-[9px] p-[14px_20px] border-t border-border bg-surface">
              <button 
                onClick={() => setIsPipelineModalOpen(false)}
                className="h-[36px] px-[14px] rounded-[9px] font-semibold text-[13px] bg-transparent hover:bg-surface-hover text-text-main transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePipeline}
                disabled={
                  creatingPipeline ||
                  !newPipelineTitle.trim() ||
                  !cron.trim() ||
                  !selectedPlanId
                }
                className="h-[36px] px-[16px] rounded-[9px] font-semibold text-[13px] bg-primary text-white flex items-center justify-center gap-[6px] hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
              >
                {creatingPipeline ? <RefreshCw size={17} className="animate-spin" /> : <Check size={17} />}
                {creatingPipeline ? "Creating..." : "Create pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
