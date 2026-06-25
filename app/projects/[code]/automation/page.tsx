"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "sonner";
import {
  Bot,
  Sparkles,
  Code2,
  PlayCircle,
  Activity,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
  RefreshCw,
  GitPullRequest,
  Eye,
  Save,
  X,
  Trash2,
  DollarSign,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TESSAAutomationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "IDLE" | "GENERATING" | "READY_TO_PUSH" | "PUSHING" | "DONE"
  >("IDLE");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Review Modal State
  const [reviewCase, setReviewCase] = useState<any | null>(null);
  const [reviewScript, setReviewScript] = useState<string>("");
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Pipeline Orchestration State
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [newPipelineTitle, setNewPipelineTitle] = useState("");
  const [scheduleType, setScheduleType] = useState("daily");
  const [scheduleTime, setScheduleTime] = useState("00:00");
  const [scheduleDay, setScheduleDay] = useState("1");
  const [customCron, setCustomCron] = useState("0 0 * * *");
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  const [stats, setStats] = useState({ total: 0, automated: 0, manual: 0 });

  useEffect(() => {
    fetchData();
  }, [code]);

  const fetchData = () => {
    fetch(`/api/projects/${code}/cases`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const manualCases = data.filter(
            (c) => c.automationStatus === "MANUAL",
          );
          const toBeAutomatedCases = data.filter(
            (c) => c.automationStatus === "TO_BE_AUTOMATED",
          );
          const automatedCases = data.filter(
            (c) =>
              c.automationStatus === "AUTOMATED" ||
              (c.automationStatus !== "MANUAL" &&
                c.automationStatus !== "TO_BE_AUTOMATED" &&
                c.automationScript),
          );

          setStats({
            total: data.length,
            automated: automatedCases.length,
            manual: manualCases.length,
          });

          const combined = [...toBeAutomatedCases, ...manualCases];
          setCases(combined);
          // Only auto-select manual ones
          setSelectedCaseIds(manualCases.map((c) => c.id));
        }
      });

    fetch(`/api/projects/${code}/pipelines`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPipelines(data);
        }
      });

    fetch(`/api/projects/${code}/ai/analytics`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setAnalytics(data);
      });
  };

  const toggleSelection = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (selectedCaseIds.length === 0) return;
    setStatus("GENERATING");
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: selectedCaseIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus("IDLE");
      fetchData(); // Refresh to show as TO_BE_AUTOMATED
    } catch (err: any) {
      setError(err.message);
      setStatus("IDLE");
    }
  };

  const handlePushToGithub = async () => {
    const pendingCases = cases
      .filter((c) => c.automationStatus === "TO_BE_AUTOMATED")
      .map((c) => c.id);
    if (pendingCases.length === 0) return;

    setStatus("PUSHING");
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-github-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: pendingCases }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPrUrl(data.prUrl);
      setStatus("DONE");

      fetchData(); // Refresh to remove AUTOMATED ones
    } catch (err: any) {
      setError(err.message);
      setStatus("IDLE");
    }
  };

  const handleOpenReview = async (tc: any) => {
    setReviewCase(tc);
    setReviewScript("Loading script...");
    try {
      const res = await fetch(`/api/projects/${code}/cases/${tc.id}`);
      const data = await res.json();
      if (data && data.automationScript) {
        setReviewScript(data.automationScript);
      } else {
        setReviewScript("// No script found.");
      }
    } catch (err) {
      setReviewScript("// Error loading script.");
    }
  };

  const handleSaveReview = async () => {
    if (!reviewCase) return;
    setIsSavingScript(true);
    try {
      await fetch(`/api/projects/${code}/cases/${reviewCase.id}/script`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: reviewScript }),
      });
      setReviewCase(null);
    } catch (err) {
      toast.error("Failed to save script");
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await fetch(`/api/projects/${code}/cases/${id}/discard`, {
        method: "POST",
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to discard");
    }
  };

  const generateCron = () => {
    if (scheduleType === "custom") return customCron;
    const [hours, minutes] = scheduleTime.split(":");
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);

    if (scheduleType === "daily") {
      return `${m} ${h} * * *`;
    } else if (scheduleType === "weekly") {
      return `${m} ${h} * * ${scheduleDay}`;
    } else if (scheduleType === "monthly") {
      return `${m} ${h} ${scheduleDay} * *`;
    }
    return "0 0 * * *";
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineTitle) return;
    setIsCreatingPipeline(true);
    try {
      const computedCron = generateCron();
      const res = await fetch(`/api/projects/${code}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPipelineTitle, cron: computedCron }),
      });
      if (res.ok) {
        setIsPipelineModalOpen(false);
        setNewPipelineTitle("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  const handleTogglePipeline = async (id: string, isActive: boolean) => {
    // Optimistic UI update
    setPipelines((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
    );
    try {
      await fetch(`/api/projects/${code}/pipelines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    } catch (err) {
      console.error(err);
      fetchData(); // revert on failure
    }
  };

  const handleTriggerPipeline = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${code}/pipelines/${id}/trigger`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Pipeline triggered! A new Test Run has been created.");
      } else {
        const err = await res.json();
        toast.error("Trigger failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pipeline schedule?"))
      return;
    try {
      setPipelines((prev) => prev.filter((p) => p.id !== id));
      await fetch(`/api/projects/${code}/pipelines/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const manualCasesCount = cases.filter(
    (c) => c.automationStatus === "MANUAL",
  ).length;
  const pendingCasesCount = cases.filter(
    (c) => c.automationStatus === "TO_BE_AUTOMATED",
  ).length;
  const showPushBtn = pendingCasesCount > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-surface-hover  overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-3 rounded-full border border-primary/30 bg-primary-light text-primary text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles size={14} className="mr-2 text-primary" />
              Powered by Generative AI
            </div>
            <h1 className="text-3xl font-extrabold text-text-main  flex items-center tracking-tight">
              TESSA{" "}
              <span className="mx-3 text-text-faint  font-light">
                |
              </span>
              <span className="text-primary font-bold">Test Orchestration</span>
            </h1>
            <p className="mt-2 text-text-muted">
              Your autonomous AI assistant for writing scripts, healing flaky
              tests, and managing pipelines.
            </p>
          </div>
          <Button
            onClick={() => setIsPipelineModalOpen(true)}
            className="shadow-[var(--shadow-float)] hover:-translate-y-0.5"
          >
            <Zap size={18} /> Create Scheduled Pipeline
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface  rounded-[13px] p-6 border border-border  shadow-[var(--shadow-float)] backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary-light transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-text-muted  mb-1">
                  AI Generated Scripts
                </p>
                <h3 className="text-3xl font-bold text-text-main ">
                  {stats.automated}
                </h3>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center border border-primary/25">
                <Code2
                  size={24}
                  className="text-primary"
                />
              </div>
            </div>
            <div className="flex items-center text-xs text-success  font-medium relative z-10">
              <Activity size={14} className="mr-1" /> System total automated
              cases
            </div>
          </div>

          <div className="bg-surface  rounded-[13px] p-6 border border-border  shadow-[var(--shadow-float)] backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success-soft rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-success-soft transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-text-muted  mb-1">
                  Executive ROI
                </p>
                <h3 className="text-3xl font-bold text-text-main ">
                  ${analytics?.roi?.estimatedValueUsd || "0"}
                </h3>
              </div>
              <div className="w-12 h-12 bg-success-soft rounded-xl flex items-center justify-center border border-success/25">
                <DollarSign
                  size={24}
                  className="text-success"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-medium relative z-10">
              <span className="text-success  flex items-center">
                <Clock size={14} className="mr-1" />{" "}
                {analytics?.roi?.totalHoursSaved || 0} hrs saved
              </span>
              <span className="text-text-muted">
                ≈ ฿{analytics?.roi?.estimatedValueThb || "0"}
              </span>
            </div>
          </div>

          <div className="bg-surface  rounded-[13px] p-6 border border-border  shadow-[var(--shadow-float)] backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-info-soft rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-info-soft transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-text-muted  mb-1">
                  Automation Coverage
                </p>
                <h3 className="text-3xl font-bold text-text-main ">
                  {stats.total > 0
                    ? Math.round((stats.automated / stats.total) * 100)
                    : 0}
                  %
                </h3>
              </div>
              <div className="w-12 h-12 bg-info-soft rounded-xl flex items-center justify-center border border-info/25">
                <Bot
                  size={24}
                  className="text-info"
                />
              </div>
            </div>
            <div className="flex items-center text-xs text-warning  font-medium relative z-10">
              <AlertTriangle size={14} className="mr-1" /> {stats.manual} manual
              cases recommended for automation
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger-soft border border-danger/25 text-danger rounded-xl flex items-center">
            <AlertTriangle size={18} className="mr-2 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {status === "DONE" && prUrl && (
          <div className="p-6 bg-success-soft border border-success/25 text-success  rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 size={24} className="mr-3 shrink-0" />
              <div>
                <h3 className="font-bold text-lg">
                  Successfully pushed to GitHub!
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  TESSA generated the scripts and opened a Pull Request for your
                  review.
                </p>
              </div>
            </div>
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-success text-white font-bold rounded-xl hover:bg-success duration-300 transition-all flex items-center shadow-[var(--shadow-float)] hover:-translate-y-0.5"
            >
              <GitPullRequest size={18} className="mr-2" /> View Pull Request
            </a>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batch Generator Panel */}
          <div className="bg-surface  rounded-[13px] border border-border/80  overflow-hidden flex flex-col shadow-[var(--shadow-float)] h-[500px]">
            <div className="px-6 py-4 border-b border-border  flex justify-between items-center bg-surface-hover/50 ">
              <h3 className="font-semibold text-text-main  flex items-center">
                <Bot size={18} className="mr-2 text-primary" /> Suggested for
                Automation
              </h3>
              <span className="text-xs font-medium text-text-muted bg-skip-soft  px-2 py-1 rounded-md">
                {selectedCaseIds.length} Selected
              </span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-sm text-text-muted">
                  <thead className="bg-surface-hover/50 border-b border-border/80 text-[11px] uppercase font-bold text-text-muted sticky top-0 tracking-wider">
                    <tr>
                      <th className="px-6 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedCaseIds.length === manualCasesCount &&
                            manualCasesCount > 0
                          }
                          onChange={() =>
                            selectedCaseIds.length === manualCasesCount
                              ? setSelectedCaseIds([])
                              : setSelectedCaseIds(
                                  cases
                                    .filter(
                                      (c) => c.automationStatus === "MANUAL",
                                    )
                                    .map((c) => c.id),
                                )
                          }
                          disabled={status !== "IDLE" || manualCasesCount === 0}
                          className="rounded border-text-muted text-primary focus:ring-primary disabled:opacity-50"
                        />
                      </th>
                      <th className="px-6 py-3">Test Case</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border  bg-surface ">
                    {cases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-text-muted"
                        >
                          No manual test cases found. Create some cases in the
                          Repository first!
                        </td>
                      </tr>
                    ) : (
                      cases.map((tc) => {
                        const isSelected = selectedCaseIds.includes(tc.id);
                        const isManual = tc.automationStatus === "MANUAL";
                        const isPending =
                          tc.automationStatus === "TO_BE_AUTOMATED";
                        return (
                          <tr
                            key={tc.id}
                            className="hover:bg-surface-hover  transition-colors"
                          >
                            <td className="px-6 py-4">
                              {isManual ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelection(tc.id)}
                                  disabled={status !== "IDLE"}
                                  className="rounded border-text-muted text-primary focus:ring-primary"
                                />
                              ) : (
                                <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                  <CheckCircle2
                                    size={10}
                                    className="text-white"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium text-text-main  truncate max-w-[250px]">
                              {tc.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isManual ? (
                                status === "GENERATING" && isSelected ? (
                                  <span className="flex items-center text-primary text-xs">
                                    <RefreshCw
                                      size={12}
                                      className="mr-1 animate-spin"
                                    />{" "}
                                    Generating...
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-xs">
                                    Ready
                                  </span>
                                )
                              ) : isPending ? (
                                <div className="flex items-center space-x-2">
                                  <span className="flex items-center text-success text-xs">
                                    <CheckCircle2 size={12} className="mr-1" />{" "}
                                    Pending PR
                                  </span>
                                  <button
                                    onClick={() => handleOpenReview(tc)}
                                    className="text-text-muted hover:text-primary transition-colors bg-surface-hover hover:bg-primary-light   p-1 rounded"
                                    title="View/Edit Code"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDiscard(tc.id)}
                                    className="text-text-muted hover:text-danger transition-colors bg-surface-hover hover:bg-danger-soft   p-1 rounded"
                                    title="Discard"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 mt-auto border-t border-border  bg-surface-hover /30">
                {!showPushBtn ? (
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleGenerate}
                    loading={status === "GENERATING"}
                    disabled={status !== "IDLE" || selectedCaseIds.length === 0}
                    className="bg-primary hover:bg-primary-hover text-white shadow-[var(--shadow-float)] hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {status === "GENERATING" ? (
                      <>Batch Generating ({selectedCaseIds.length})...</>
                    ) : (
                      <>
                        <Sparkles size={18} /> Ask TESSA to Generate Scripts
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handlePushToGithub}
                    loading={status === "PUSHING"}
                    disabled={status === "PUSHING" || status === "GENERATING"}
                    className="bg-[var(--success)] hover:bg-[var(--success)] text-white shadow-[var(--shadow-float)] hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {status === "PUSHING" ? (
                      <>Creating Pull Request...</>
                    ) : (
                      <>
                        <GitPullRequest size={18} /> Push {pendingCasesCount}{" "}
                        Scripts to GitHub PR
                      </>
                    )}
                  </Button>
                )}
                <p className="text-center text-xs text-text-muted mt-3 flex items-center justify-center">
                  <Activity size={12} className="mr-1" /> TESSA estimates this
                  will save {(selectedCaseIds.length || pendingCasesCount) * 45}{" "}
                  minutes of manual work
                </p>
              </div>
            </div>
          </div>

          {/* Healing Logs & Pipeline */}
          <div className="space-y-8 flex flex-col">
            {/* Flakiness Radar */}
            <div className="bg-surface  rounded-[13px] border border-border/80  shadow-[var(--shadow-float)] flex-1">
              <div className="px-6 py-4 border-b border-border  flex justify-between items-center bg-surface-hover/50  rounded-t-2xl">
                <h3 className="font-semibold text-text-main  flex items-center">
                  <Activity size={18} className="mr-2 text-danger" />{" "}
                  Flakiness Radar
                </h3>
                <span className="text-xs bg-surface-hover  text-text-muted px-2 py-1 rounded-full font-medium">
                  Top {analytics?.flakiness?.length || 0}
                </span>
              </div>
              <div className="p-0">
                {!analytics?.flakiness || analytics.flakiness.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm">
                    No flaky tests detected yet. Everything is stable!
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {analytics.flakiness.map((item: any) => (
                      <div
                        key={item.caseId}
                        className="p-4 hover:bg-surface-hover  transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <h4 className="text-sm font-semibold text-text-main  truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center mt-1.5 space-x-1">
                            {item.recentStatuses.map((s: string, i: number) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${s === "PASSED" ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                                title={s}
                              ></div>
                            ))}
                            <span className="text-[10px] text-text-muted ml-2 font-medium">
                              Score: {item.flakinessScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="bg-surface  rounded-[13px] border border-border/80  shadow-[var(--shadow-float)]">
              <div className="px-6 py-4 border-b border-border  flex justify-between items-center bg-surface-hover/50  rounded-t-2xl">
                <h3 className="font-semibold text-text-main  flex items-center">
                  <PlayCircle size={18} className="mr-2 text-primary" />{" "}
                  Pipeline Orchestration
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {pipelines.length === 0 ? (
                  <div className="text-center py-6 text-text-muted text-sm">
                    No scheduled pipelines yet. Create one above!
                  </div>
                ) : (
                  pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="bg-surface-hover  rounded-xl p-4 border border-border  flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#24292F] flex items-center justify-center mr-4 shadow-sm shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-main  text-sm">
                            {pipeline.title}
                          </h4>
                          <p className="text-xs text-text-muted">
                            Schedule:{" "}
                            <code className="bg-skip-soft  px-1 rounded">
                              {pipeline.cron}
                            </code>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleTriggerPipeline(pipeline.id)}
                          className="uppercase tracking-wider bg-info-soft text-primary  hover:bg-info-soft shadow-sm hover:-translate-y-0.5"
                        >
                          <PlayCircle size={14} /> Run Now
                        </Button>

                        <label className="flex items-center cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={pipeline.isActive}
                              onChange={(e) =>
                                handleTogglePipeline(
                                  pipeline.id,
                                  e.target.checked,
                                )
                              }
                            />
                            <div
                              className={`block w-10 h-6 rounded-full transition-colors ${pipeline.isActive ? "bg-success" : "bg-skip-soft"}`}
                            ></div>
                            <div
                              className={`absolute left-[2px] top-[2px] bg-surface w-5 h-5 rounded-full transition-transform transform ${pipeline.isActive ? "translate-x-4" : ""} shadow-sm`}
                            ></div>
                          </div>
                          <div className="ml-2 text-xs font-bold w-12 text-center">
                            {pipeline.isActive ? (
                              <span className="text-success">Active</span>
                            ) : (
                              <span className="text-text-muted">Standby</span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => handleDeletePipeline(pipeline.id)}
                          className="text-xs font-bold px-2 py-1.5 text-text-muted hover:text-danger hover:bg-danger-soft  rounded-xl transition-colors flex items-center"
                          title="Delete Schedule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Script Modal */}
      {reviewCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface  w-full max-w-4xl rounded-[13px] shadow-[var(--shadow-float)] border border-border/80  overflow-hidden flex flex-col h-[80vh]">
            <div className="px-6 py-4 border-b border-border  flex justify-between items-center bg-surface-hover /80">
              <h3 className="font-semibold text-text-main  flex items-center">
                <Code2 size={18} className="mr-2 text-primary" /> Review
                Generated Script
              </h3>
              <button
                onClick={() => setReviewCase(null)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-surface-hover border-b border-border  text-sm">
              <span className="font-semibold text-text-main">
                Test Case:
              </span>{" "}
              {reviewCase.title}
            </div>

            <div className="flex-1 overflow-hidden relative">
              <textarea
                className="w-full h-full p-6 bg-[#0d1117] text-success font-mono text-sm resize-none focus:outline-none"
                value={reviewScript}
                onChange={(e) => setReviewScript(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="px-6 py-4 border-t border-border  bg-surface-hover /80 flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setReviewCase(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveReview}
                loading={isSavingScript}
                disabled={isSavingScript}
                className="shadow-[var(--shadow-float)] hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
              >
                {!isSavingScript && <Save size={16} />}
                {isSavingScript ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Pipeline Modal */}
      {isPipelineModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface  w-full max-w-md rounded-[13px] shadow-[var(--shadow-float)] border border-border/80  overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border  flex justify-between items-center bg-surface-hover ">
              <h3 className="font-semibold text-text-main  flex items-center">
                <PlayCircle size={18} className="mr-2 text-primary" /> Create
                Scheduled Pipeline
              </h3>
              <button
                onClick={() => setIsPipelineModalOpen(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main  mb-1">
                  Pipeline Title
                </label>
                <input
                  type="text"
                  value={newPipelineTitle}
                  onChange={(e) => setNewPipelineTitle(e.target.value)}
                  placeholder="e.g. Nightly Regression"
                  className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 outline-none shadow-inner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main  mb-1">
                  Schedule Frequency
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 outline-none mb-3 shadow-inner"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom (Cron)</option>
                </select>

                {scheduleType !== "custom" && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-muted  mb-1">
                        Time (UTC)
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 outline-none shadow-inner"
                      />
                    </div>
                    {scheduleType === "weekly" && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-text-muted  mb-1">
                          Day of Week
                        </label>
                        <select
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(e.target.value)}
                          className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 outline-none shadow-inner"
                        >
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                          <option value="0">Sunday</option>
                        </select>
                      </div>
                    )}
                    {scheduleType === "monthly" && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-text-muted  mb-1">
                          Day of Month
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(e.target.value)}
                          className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 outline-none shadow-inner"
                        />
                      </div>
                    )}
                  </div>
                )}

                {scheduleType === "custom" && (
                  <div>
                    <input
                      type="text"
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      placeholder="0 0 * * *"
                      className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-[13px] font-semibold text-text-main font-mono focus:ring-4 focus:ring-primary/20 outline-none shadow-inner"
                    />
                    <p className="text-xs text-text-muted mt-2">
                      Example: <code>0 0 * * *</code> (Runs every midnight UTC).
                    </p>
                  </div>
                )}

                {scheduleType !== "custom" && (
                  <p className="text-xs text-text-muted mt-3 font-mono bg-surface-hover  p-2 rounded">
                    Generated Cron: {generateCron()}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border  bg-surface-hover  flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setIsPipelineModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePipeline}
                loading={isCreatingPipeline}
                disabled={
                  isCreatingPipeline ||
                  !newPipelineTitle ||
                  (scheduleType === "custom" && !customCron)
                }
                className="shadow-[var(--shadow-float)] hover:-translate-y-0.5 disabled:transform-none"
              >
                {!isCreatingPipeline && <Save size={16} />}
                {isCreatingPipeline ? "Creating..." : "Save Pipeline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
