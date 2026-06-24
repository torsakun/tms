"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  PlayCircle,
  Settings,
  X,
  Edit3,
  Copy,
  Trash2,
  Cpu,
  FileText,
  Sparkles,
  CloudUpload,
  Loader2,
  GitMerge,
  ExternalLink,
  Ticket,
  Plus,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { SuiteList } from "@/components/repository/SuiteList";
import { AiGeneratorModal } from "@/components/repository/AiGeneratorModal";
import { AiImpactModal } from "@/components/repository/AiImpactModal";
import { BulkJiraImpactModal } from "@/components/repository/BulkJiraImpactModal";
import { TestCaseAutomationPanel } from "@/components/repository/TestCaseAutomationPanel";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { CloneSuiteModal } from "@/components/repository/CloneSuiteModal";
import { ImportCasesModal } from "@/components/repository/ImportCasesModal";
import { BulkEditModal } from "@/components/repository/BulkEditModal";
import { useSuiteSelection } from "@/components/providers/SuiteSelectionProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CommentThread } from "@/components/ui/CommentThread";
import { Button, ButtonLink } from "@/components/ui/Button";

interface RepositoryContentProps {
  projectCode: string;
  suites: any[];
  cases: any[];
  activeSuiteId: string | null;
  totalCases?: number;
  totalSuites?: number;
}

export function RepositoryContent({
  projectCode,
  suites,
  cases,
  activeSuiteId,
  totalCases,
  totalSuites,
}: RepositoryContentProps) {
  const router = useRouter();
  const { role } = useProjectRole();
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<
    "general" | "defects" | "comments" | "history"
  >("general");
  const [history, setHistory] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  React.useEffect(() => {
    if (detailTab !== "history" || !activeTestCaseId) return;
    let alive = true;
    setHistoryLoading(true);
    Promise.all([
      fetch(`/api/projects/${projectCode}/cases/${activeTestCaseId}/history`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`/api/projects/${projectCode}/cases/${activeTestCaseId}/changes`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([h, c]) => {
        if (!alive) return;
        setHistory(Array.isArray(h) ? h : []);
        setChanges(Array.isArray(c) ? c : []);
      })
      .finally(() => alive && setHistoryLoading(false));
    return () => {
      alive = false;
    };
  }, [detailTab, activeTestCaseId, projectCode]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"all" | "title">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [automationFilter, setAutomationFilter] = useState<Set<string>>(
    new Set(),
  );
  const filterRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const activeFilterCount = priorityFilter.size + automationFilter.size;
  const toggleSetValue = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCloneCasesModalOpen, setIsCloneCasesModalOpen] = useState(false);
  const [isCloningCases, setIsCloningCases] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [isBulkJiraModalOpen, setIsBulkJiraModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastSyncPr, setLastSyncPr] = useState<{
    url: string;
    number: number | null;
  } | null>(null);
  const [customFieldsDef, setCustomFieldsDef] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmSync, setConfirmSync] = useState(false);
  const [confirmDeleteCase, setConfirmDeleteCase] = useState(false);

  const { selectedCases, clearSelection } = useSuiteSelection();
  const hasSelection = selectedCases.size > 0;

  const handleBulkDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: Array.from(selectedCases) }),
      });

      if (res.ok) {
        clearSelection();
        toast.success("Successfully deleted selected test cases");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete test cases");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting test cases");
    }
  };

  const handleBulkClone = () => {
    setIsCloneCasesModalOpen(true);
  };

  const executeBulkClone = async (payload: {
    destinationId: string | null;
  }) => {
    setIsCloningCases(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk-clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseIds: Array.from(selectedCases),
          destinationId: payload.destinationId,
        }),
      });

      if (res.ok) {
        setIsCloneCasesModalOpen(false);
        clearSelection();
        toast.success("Successfully cloned selected test cases");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to clone test cases");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cloning test cases");
    } finally {
      setIsCloningCases(false);
    }
  };

  const handleBulkRun = () => {
    const caseIds = Array.from(selectedCases).join(",");
    router.push(`/projects/${projectCode}/runs/create?cases=${caseIds}`);
  };

  const handleBulkEdit = () => {
    setIsBulkEditModalOpen(true);
  };

  const executeBulkEdit = async (fields: Record<string, string>) => {
    setIsBulkEditing(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: Array.from(selectedCases), fields }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsBulkEditModalOpen(false);
        clearSelection();
        toast.success(
          `Updated ${data.count} test case${data.count !== 1 ? "s" : ""}`,
        );
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update test cases");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating test cases");
    } finally {
      setIsBulkEditing(false);
    }
  };

  React.useEffect(() => {
    fetch("/api/workspace/fields")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomFieldsDef(data);
      })
      .catch(console.error);
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setLastSyncPr(null);
    try {
      const res = await fetch(`/api/projects/${projectCode}/github/sync-all`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      setLastSyncPr({ url: data.prUrl, number: data.prNumber });
      toast.success(`Success! Created PR for ${data.count} test cases.`);
      router.refresh();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickMerge = async () => {
    if (!lastSyncPr?.number) return;

    setIsMerging(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/github/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prNumber: lastSyncPr.number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");

      toast.success(`Merged successfully! ${data.message || ""}`);
      setLastSyncPr(null);
    } catch (err: any) {
      toast.error(`Error merging PR: ${err.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleExportQase = () => {
    window.open(`/api/projects/${projectCode}/export-qase`, "_blank");
  };

  const handleExportCsv = () => {
    window.open(`/api/projects/${projectCode}/export-csv`, "_blank");
  };

  const activeTestCase = cases.find((c) => c.id === activeTestCaseId);

  const handleCloneCase = async () => {
    if (!activeTestCase) return;
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk-clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseIds: [activeTestCase.id],
          destinationId: activeTestCase.suiteId || null,
        }),
      });
      if (res.ok) {
        toast.success("Test case cloned successfully");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to clone test case");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cloning test case");
    }
  };

  const handleDeleteActiveCase = async () => {
    if (!activeTestCase) return;
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/cases/${activeTestCase.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Test case deleted successfully");
        setActiveTestCaseId(null);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete test case");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting test case");
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-surface transition-colors">
        {/* ── Page header row: title + action buttons ── */}
        <div
          className="flex items-center justify-between px-6 py-3 bg-surface border-b shrink-0"
          style={{
            borderColor: "var(--border-color)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
          }}
        >
          {/* Left: title + counts */}
          {hasSelection ? (
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text-main">
                {projectCode}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-[15px] font-bold text-text-main">
                Repository
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full ml-1">
                {selectedCases.size} selected
                <button
                  onClick={clearSelection}
                  className="ml-0.5 text-indigo-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-bold text-text-main">
                {projectCode}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-[15px] font-bold text-text-main">
                Repository
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
                {totalCases ?? cases.length} cases
              </span>
              <span className="text-[11px] font-medium text-text-muted">
                {totalSuites ?? suites.length} suites
              </span>
            </div>
          )}

          {/* Right: action buttons */}
          {hasSelection ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-surface-hover border border-border rounded-lg px-1 py-1">
                <button
                  onClick={handleBulkEdit}
                  className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit3 size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  onClick={handleBulkClone}
                  className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors"
                  title="Clone"
                >
                  <Copy size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  onClick={handleBulkRun}
                  className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-surface rounded-md transition-colors"
                  title="Run"
                >
                  <PlayCircle size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  className="p-1.5 text-text-muted hover:text-red-500 hover:bg-surface rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <button className="flex items-center px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border text-text-main text-[13px] font-medium rounded-lg transition-colors shadow-sm">
                <Cpu size={14} className="mr-1.5 text-indigo-500" /> Automate
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {lastSyncPr && (
                <div className="flex items-center gap-2 bg-surface-hover border border-border px-2 py-1 rounded-lg">
                  <a
                    href={lastSyncPr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-xs font-medium text-text-main hover:text-indigo-600 hover:underline transition-colors px-2 py-1"
                  >
                    <ExternalLink size={13} className="mr-1" /> View PR #
                    {lastSyncPr.number}
                  </a>
                  {role !== "VIEWER" && (
                    <button
                      onClick={handleQuickMerge}
                      disabled={isMerging}
                      className="flex items-center bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isMerging ? (
                        <Loader2 size={12} className="mr-1 animate-spin" />
                      ) : (
                        <GitMerge size={12} className="mr-1" />
                      )}{" "}
                      Quick Merge
                    </button>
                  )}
                </div>
              )}
              {role !== "VIEWER" && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    loading={isSyncing}
                    onClick={() => setConfirmSync(true)}
                    title="Sync to GitHub"
                    className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20 font-bold"
                  >
                    {!isSyncing && <CloudUpload size={14} />}
                    Sync
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setIsBulkJiraModalOpen(true)}
                    title="Story Impact Analysis"
                    className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20 font-bold"
                  >
                    <Ticket size={14} /> Impact
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setIsAiModalOpen(true)}
                    title="Generate AI Tests"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 font-bold"
                  >
                    <Sparkles size={14} /> AI Gen
                  </Button>
                  <ButtonLink
                    href={`/projects/${projectCode}/cases/create`}
                    size="md"
                  >
                    <Plus size={14} /> Test Case
                  </ButtonLink>
                  <div className="relative group">
                    <Button variant="secondary" size="md">
                      <Settings size={14} /> Options
                    </Button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="p-1 flex flex-col gap-0.5">
                        <button
                          onClick={handleExportQase}
                          className="flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-lg text-left"
                        >
                          <Download size={14} className="mr-2 text-text-muted" />{" "}
                          Export Qase
                        </button>
                        <button
                          onClick={handleExportCsv}
                          className="flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-lg text-left"
                        >
                          <Download size={14} className="mr-2 text-text-muted" />{" "}
                          Export CSV (Excel)
                        </button>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-lg text-left"
                        >
                          <Upload size={14} className="mr-2 text-text-muted" />{" "}
                          Import Qase
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Search row ── */}
        <div
          className="flex items-center gap-2 px-6 py-2.5 bg-surface border-b shrink-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={14}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases…"
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-hover border border-border text-text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
            />
          </div>
          <select
            value={searchScope}
            onChange={(e) => setSearchScope(e.target.value as "all" | "title")}
            className="px-3 py-2 text-[13px] bg-surface-hover border border-border text-text-muted rounded-lg focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer w-36"
          >
            <option value="all">By all fields</option>
            <option value="title">By title</option>
          </select>

          {/* ── Advanced filter ── */}
          <div className="relative" ref={filterRef}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFilterOpen((o) => !o)}
              className={
                activeFilterCount > 0 || filterOpen
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  : ""
              }
            >
              <Filter size={14} />
              Filter
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {filterOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-surface border border-border rounded-xl shadow-lg z-50 p-3 animate-fade-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                    Priority
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setPriorityFilter(new Set());
                        setAutomationFilter(new Set());
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["HIGH", "MEDIUM", "LOW", "NOT_SET"].map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleSetValue(setPriorityFilter, p)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        priorityFilter.has(p)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-surface-hover text-text-muted border-border hover:text-text-main"
                      }`}
                    >
                      {p === "NOT_SET" ? "Not set" : p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted block mb-2">
                  Automation
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["MANUAL", "Manual"],
                    ["TO_BE_AUTOMATED", "To automate"],
                    ["AUTOMATED", "Automated"],
                  ].map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => toggleSetValue(setAutomationFilter, v)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        automationFilter.has(v)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-surface-hover text-text-muted border-border hover:text-text-main"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hierarchical Content */}
        <div className="flex-1 overflow-y-auto bg-surface relative transition-colors">
          <div className="p-6 pb-32">
            <SuiteList
              suites={suites}
              cases={cases}
              activeSuiteId={activeSuiteId}
              projectCode={projectCode}
              onSelectCase={(tc: any) => {
                setDetailTab("general");
                setActiveTestCaseId(tc.id);
              }}
              searchQuery={searchQuery}
              searchScope={searchScope}
              priorityFilter={priorityFilter}
              automationFilter={automationFilter}
            />
          </div>
        </div>
      </div>

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        projectCode={projectCode}
        suites={suites}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <BulkJiraImpactModal
        isOpen={isBulkJiraModalOpen}
        onClose={() => setIsBulkJiraModalOpen(false)}
        projectCode={projectCode}
        suites={suites}
        allCases={cases}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <CloneSuiteModal
        isOpen={isCloneCasesModalOpen}
        onClose={() => setIsCloneCasesModalOpen(false)}
        mode="cases"
        caseCount={selectedCases.size}
        allSuites={suites}
        projectCode={projectCode}
        onClone={executeBulkClone as any}
        isCloning={isCloningCases}
      />

      <ImportCasesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        projectCode={projectCode}
        suites={suites}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        count={selectedCases.size}
        suites={suites}
        onApply={executeBulkEdit}
        isSaving={isBulkEditing}
      />

      {/* Slide-over Detail Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[55vw] min-w-[600px] bg-surface shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${activeTestCaseId ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderColor: "var(--border-color)" }}
      >
        {activeTestCase && (
          <>
            <header
              className="flex flex-col px-6 pt-5 pb-0 border-b bg-surface shrink-0"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">
                  {`${projectCode}-${activeTestCase.sequenceNumber || activeTestCase.id.substring(0, 4)}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const code = `${projectCode}-${activeTestCase.sequenceNumber || activeTestCase.id.substring(0, 4)}`;
                      navigator.clipboard?.writeText(code);
                      toast.success(`Copied ${code}`);
                    }}
                    title="Copy case ID"
                    className="text-text-muted hover:text-text-main hover:bg-surface-hover p-1.5 rounded-lg transition-colors"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => setActiveTestCaseId(null)}
                    className="text-text-muted hover:text-red-500 hover:bg-surface-hover p-1.5 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <h2 className="text-lg font-bold text-text-main tracking-tight break-words mb-4 leading-snug">
                {activeTestCase.title}
              </h2>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() =>
                    router.push(
                      `/projects/${projectCode}/cases/${activeTestCase.id}/edit`,
                    )
                  }
                  className="bg-surface border border-border hover:bg-surface-hover hover:border-indigo-200 hover:text-indigo-600 text-text-muted p-2 rounded-lg transition-colors shadow-sm"
                  title="Edit case"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={handleCloneCase}
                  className="bg-surface border border-border hover:bg-surface-hover hover:border-indigo-200 hover:text-indigo-600 text-text-muted p-2 rounded-lg transition-colors shadow-sm"
                  title="Clone case"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={() => setConfirmDeleteCase(true)}
                  className="bg-surface border border-border hover:bg-surface-hover hover:border-red-200 hover:text-red-500 text-text-muted p-2 rounded-lg transition-colors shadow-sm"
                  title="Delete case"
                >
                  <Trash2 size={15} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  className="text-white shadow-sm px-3 py-1.5 rounded-lg text-[13px] font-semibold flex items-center transition-all hover:-translate-y-0.5"
                  style={{
                    background: "var(--primary)",
                  }}
                >
                  <Cpu size={13} className="mr-1.5" /> Automate
                </button>
              </div>

              <div className="flex gap-6">
                <button
                  onClick={() => setDetailTab("general")}
                  className={`pb-3 pt-1 border-b-2 text-sm transition-colors ${detailTab === "general" ? "border-indigo-500 text-indigo-600 font-bold" : "border-transparent text-text-muted hover:text-text-main font-medium"}`}
                >
                  General
                </button>
                <button
                  onClick={() => setDetailTab("defects")}
                  className={`pb-3 pt-1 border-b-2 text-sm transition-colors flex items-center gap-1.5 ${detailTab === "defects" ? "border-indigo-500 text-indigo-600 font-bold" : "border-transparent text-text-muted hover:text-text-main font-medium"}`}
                >
                  Defects
                  {activeTestCase.linkedIssues?.length > 0 && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full">
                      {activeTestCase.linkedIssues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDetailTab("comments")}
                  className={`pb-3 pt-1 border-b-2 text-sm transition-colors ${detailTab === "comments" ? "border-indigo-500 text-indigo-600 font-bold" : "border-transparent text-text-muted hover:text-text-main font-medium"}`}
                >
                  Comments
                </button>
                <button
                  onClick={() => setDetailTab("history")}
                  className={`pb-3 pt-1 border-b-2 text-sm transition-colors ${detailTab === "history" ? "border-indigo-500 text-indigo-600 font-bold" : "border-transparent text-text-muted hover:text-text-main font-medium"}`}
                >
                  History
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-surface p-5 space-y-4">
              {detailTab === "general" && (
              <>
              {activeTestCase.isOutdated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col space-y-3 shadow-sm mb-4">
                  <div className="flex items-start">
                    <AlertTriangle
                      size={20}
                      className="text-amber-500 mr-2 shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">
                        Requirement Changed
                      </h4>
                      <p className="text-xs text-amber-700 mt-1">
                        The requirement linked to this test case has been
                        updated. The steps may be outdated.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsImpactModalOpen(true)}
                    className="self-start flex items-center bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Sparkles size={14} className="mr-1.5" /> Analyze Impact
                    with AI
                  </button>
                </div>
              )}
              <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-sm">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Description
                </h3>
                <div className="text-sm text-text-main leading-relaxed">
                  {activeTestCase.description || (
                    <span className="text-text-muted italic">Not set</span>
                  )}
                </div>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-sm">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Pre-conditions
                </h3>
                <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap break-words">
                  {activeTestCase.preconditions ? (
                    activeTestCase.preconditions
                  ) : (
                    <span className="text-text-muted italic">Not set</span>
                  )}
                </div>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-sm">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Post-conditions
                </h3>
                <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap break-words">
                  {activeTestCase.postconditions ? (
                    activeTestCase.postconditions
                  ) : (
                    <span className="text-text-muted italic">Not set</span>
                  )}
                </div>
              </div>

              {activeTestCase.customFields &&
                Object.keys(activeTestCase.customFields).length > 0 && (
                  <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-sm">
                    <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4">
                      Custom Fields
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeTestCase.customFields).map(
                        ([fieldId, value]) => {
                          if (!value || (typeof value === "boolean" && !value))
                            return null;
                          const fieldDef = customFieldsDef.find(
                            (f) => f.id === fieldId,
                          );
                          const label = fieldDef ? fieldDef.name : fieldId;
                          return (
                            <div key={fieldId}>
                              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                {label}
                              </div>
                              <div className="text-sm text-text-main font-medium">
                                {typeof value === "boolean"
                                  ? "Yes"
                                  : String(value)}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

              <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Steps
                  </h3>
                  <button
                    onClick={() =>
                      router.push(
                        `/projects/${projectCode}/cases/${activeTestCase.id}/edit`,
                      )
                    }
                    className="text-indigo-500 hover:text-indigo-700 text-xs font-bold flex items-center transition-colors"
                  >
                    <Edit3 size={12} className="mr-1" /> Edit
                  </button>
                </div>

                {activeTestCase.steps && activeTestCase.steps.length > 0 ? (
                  <div className="space-y-4">
                    {activeTestCase.steps.map((step: any, idx: number) => (
                      <div key={step.id || idx} className="flex">
                        <div className="w-8 shrink-0 flex justify-center mt-0.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-sm"
                            style={{
                              background:
                                "var(--primary)",
                            }}
                          >
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 ml-2 text-sm text-text-main whitespace-pre-wrap leading-relaxed">
                          {step.action}
                          {step.expectedResult && (
                            <div className="mt-2 text-[13px] bg-surface-hover border border-border rounded-lg pl-3 pr-3 py-2 text-text-main">
                              <span className="font-bold text-emerald-700">
                                Expected:{" "}
                              </span>
                              {step.expectedResult}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text-muted italic">Not set</div>
                )}
              </div>

              <TestCaseAutomationPanel
                testCase={activeTestCase}
                projectCode={projectCode}
                onUpdate={() => window.location.reload()}
              />
              </>
              )}

              {detailTab === "defects" &&
                (activeTestCase.linkedIssues &&
                activeTestCase.linkedIssues.length > 0 ? (
                  <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Ticket size={12} className="text-rose-500" /> Linked
                      Defects ({activeTestCase.linkedIssues.length})
                    </h3>
                    <div className="space-y-2">
                      {activeTestCase.linkedIssues.map((iss: any) => (
                        <a
                          key={iss.id}
                          href={iss.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-rose-200 hover:bg-rose-50/40 transition-colors group"
                        >
                          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded shrink-0">
                            {iss.key}
                          </span>
                          <span className="flex-1 text-sm text-text-main truncate">
                            {iss.summary}
                          </span>
                          {iss.severity && (
                            <span className="text-[10px] font-bold text-text-muted uppercase shrink-0">
                              {iss.severity}
                            </span>
                          )}
                          <ExternalLink
                            size={13}
                            className="text-slate-300 group-hover:text-rose-400 shrink-0"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Ticket size={28} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-text-muted">
                      No linked defects
                    </p>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                      Defects reported during a run and linked to this case will
                      appear here.
                    </p>
                  </div>
                ))}

              {detailTab === "comments" && activeTestCaseId && (
                <CommentThread
                  endpoint={`/api/projects/${projectCode}/cases/${activeTestCaseId}/comments`}
                />
              )}

              {detailTab === "history" &&
                (historyLoading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-text-muted">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading
                    history…
                  </div>
                ) : history.length === 0 && changes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <PlayCircle size={28} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-text-muted">
                      No history yet
                    </p>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                      No edits or test-run executions recorded for this case.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {changes.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted mb-2">
                          Changes
                        </h4>
                        <div className="space-y-2">
                          {changes.map((ch: any) => {
                            const FIELD_LABELS: Record<string, string> = {
                              title: "Title",
                              description: "Description",
                              preconditions: "Preconditions",
                              postconditions: "Postconditions",
                              priority: "Priority",
                              severity: "Severity",
                              automationStatus: "Automation",
                              suiteId: "Suite",
                              requirementText: "Requirement",
                              steps: "Steps",
                            };
                            const who =
                              ch.user?.name ||
                              ch.user?.email?.split("@")[0] ||
                              "Someone";
                            const labels = (ch.fields || []).map(
                              (f: string) => FIELD_LABELS[f] || f,
                            );
                            return (
                              <div
                                key={ch.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-hover/40"
                              >
                                <Edit3
                                  size={14}
                                  className="text-indigo-500 shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-text-main">
                                    <span className="font-semibold">{who}</span>{" "}
                                    {ch.action === "CREATED"
                                      ? "created this case"
                                      : labels.length > 0
                                        ? `updated ${labels.join(", ")}`
                                        : "updated this case"}
                                  </p>
                                  <p className="text-[11px] text-text-muted mt-0.5">
                                    {new Date(ch.createdAt).toLocaleString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {history.length > 0 && (
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted mb-2">
                        Execution history
                      </h4>
                    )}
                    <div className="space-y-2">
                    {history.map((h: any) => {
                      const meta =
                        {
                          PASSED: { c: "#10b981", l: "Passed" },
                          FAILED: { c: "#ef4444", l: "Failed" },
                          BLOCKED: { c: "#f59e0b", l: "Blocked" },
                          SKIPPED: { c: "#94a3b8", l: "Skipped" },
                          INVALID: { c: "#8b5cf6", l: "Invalid" },
                          IN_PROGRESS: { c: "#cbd5e1", l: "Untested" },
                        }[h.status as string] || {
                          c: "#cbd5e1",
                          l: h.status,
                        };
                      return (
                        <a
                          key={h.id}
                          href={`/projects/${projectCode}/runs/${h.testRun?.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: meta.c }}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-text-main truncate">
                              {h.testRun?.title || "Run"}
                            </span>
                            <span className="block text-[11px] text-text-muted">
                              {new Date(h.createdAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {h.assignee
                                ? ` · ${h.assignee.name || h.assignee.email?.split("@")[0]}`
                                : ""}
                            </span>
                          </span>
                          <span
                            className="text-[11px] font-bold shrink-0"
                            style={{ color: meta.c }}
                          >
                            {meta.l}
                          </span>
                        </a>
                      );
                    })}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      <AiImpactModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        projectCode={projectCode}
        testCase={activeTestCase || {}}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Backdrop for sliding panel */}
      {activeTestCaseId && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-[50] transition-opacity"
          onClick={() => setActiveTestCaseId(null)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selectedCases.size} test case${selectedCases.size > 1 ? "s" : ""}`}
          message="Selected test cases will be permanently deleted. This action cannot be undone."
          onConfirm={() => {
            setConfirmBulkDelete(false);
            handleBulkDelete();
          }}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
      {confirmSync && (
        <ConfirmDialog
          title="Sync to GitHub"
          message="This will export all automated test cases to a single GitHub Pull Request. Continue?"
          confirmLabel="Sync"
          variant="warning"
          onConfirm={() => {
            setConfirmSync(false);
            handleSyncAll();
          }}
          onCancel={() => setConfirmSync(false)}
        />
      )}
      {confirmDeleteCase && activeTestCase && (
        <ConfirmDialog
          title="Delete test case"
          message={`"${activeTestCase.title}" will be permanently deleted. This action cannot be undone.`}
          onConfirm={() => {
            setConfirmDeleteCase(false);
            handleDeleteActiveCase();
          }}
          onCancel={() => setConfirmDeleteCase(false)}
        />
      )}
    </>
  );
}
