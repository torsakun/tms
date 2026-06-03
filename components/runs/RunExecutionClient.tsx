"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, RefreshCw, ArrowLeft, Eye, Edit3, VolumeX, Settings, ChevronRight, ChevronDown, Clock, X, PlayCircle, Check, Share, Download, MoreHorizontal, Loader2, Terminal, BarChart2, Edit, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createRoot } from "react-dom/client";
import { PdfReportTemplate } from "./PdfReportTemplate";
import { formatThaiTime } from "@/lib/utils";

interface RunExecutionClientProps {
  run: any;
  suites: any[];
  projectCode: string;
  runId: string;
}

function ResultRow({ result, depth, isSelected, openResult, projectCode, runId, onDelete, onUpdateAssignee, onAssignClick }: any) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PASSED": return "bg-emerald-500 text-white";
      case "FAILED": return "bg-red-500 text-white";
      case "BLOCKED": return "bg-orange-500 text-white";
      case "SKIPPED": return "bg-slate-400 text-white";
      default: return "bg-surface-hover text-text-muted border border-border";
    }
  };

  const handleAssignToMe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onUpdateAssignee(result.id, "me"); // "me" implies current user, API will need true ID later
    try {
      await fetch(`/api/runs/${runId}/results/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Hardcoding a dummy assignee ID for MVP, real app uses session user ID
        body: JSON.stringify({ assigneeId: "dummy-user-id" }) 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onUpdateAssignee(result.id, null);
    try {
      await fetch(`/api/runs/${runId}/results/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: null }) 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm("Are you sure you want to remove this test case from the run?")) return;
    onDelete(result.id);
    try {
      await fetch(`/api/runs/${runId}/results/${result.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/projects/${projectCode}/cases/${result.testCase.id}/edit`);
  };

  return (
    <div 
      onClick={() => openResult(result)}
      className={`flex items-center group cursor-pointer border-b border-border/50 transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-surface-hover bg-surface'
      }`}
      style={{ paddingLeft: `${depth * 24 + 16}px` }}
    >
      <div className="py-2.5 px-3 flex items-center w-full relative">
        <input type="checkbox" className="w-4 h-4 mr-4 rounded border-border text-primary focus:ring-primary/20" onClick={e => e.stopPropagation()} />
        <div className="w-12 text-text-muted text-xs font-mono mr-2 flex items-center">
           <div className={`w-1.5 h-4 rounded-sm mr-2 ${result.status === 'PASSED' ? 'bg-emerald-500' : result.status === 'FAILED' ? 'bg-red-500' : result.status === 'BLOCKED' ? 'bg-orange-500' : result.status === 'SKIPPED' ? 'bg-slate-400' : 'bg-background border border-border'}`} />
           {result.testCase.id.substring(0,4).toUpperCase()}
        </div>
        <div className="flex-1 flex items-center">
          <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded mr-3 ${getStatusColor(result.status)}`}>
            {result.status === "IN_PROGRESS" ? "Untested" : result.status.charAt(0) + result.status.slice(1).toLowerCase()}
          </span>
          <span className={`text-sm ${isSelected ? 'text-primary font-semibold' : 'text-text-main font-medium group-hover:text-primary transition-colors'}`}>
            {result.testCase.title}
          </span>
        </div>
        <div className="w-48 flex items-center justify-between">
          <div className="flex items-center">
            {result.assigneeId ? (
              <>
                <div className="w-6 h-6 rounded bg-[#b87c88] text-[10px] text-white flex items-center justify-center font-bold mr-2">ME</div>
                <span className="text-xs text-text-muted truncate w-24">Assignee</span>
              </>
            ) : (
              <span className="text-xs text-text-muted italic opacity-50">Unassigned</span>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 text-text-muted hover:text-text-main hover:bg-border rounded transition-all"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-md shadow-lg z-50 py-1 overflow-hidden">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openResult(result); }} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">Run wizard</button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAssignClick(result.id); }} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">Assign</button>
                <button onClick={handleAssignToMe} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">Assign to me</button>
                <button onClick={handleUnassign} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">Unassign case</button>
                <div className="h-px bg-border my-1"></div>
                <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">Edit case</button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openResult(result); }} className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover">View case</button>
                <div className="h-px bg-border my-1"></div>
                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunExecutionClient({ run: initialRun, suites, projectCode, runId }: RunExecutionClientProps) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{url: string, name: string, isTrace?: boolean} | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({});

  const [isExecutingAutomated, setIsExecutingAutomated] = useState(false);
  const [automationLogs, setAutomationLogs] = useState("");

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPublicLinkOn, setIsPublicLinkOn] = useState(initialRun.isPublic || false);
  const [isTogglingLink, setIsTogglingLink] = useState(false);

  const togglePublicLink = async () => {
    setIsTogglingLink(true);
    try {
      const newState = !isPublicLinkOn;
      const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newState }),
      });
      if (!res.ok) throw new Error("Failed to update public link status");
      setIsPublicLinkOn(newState);
      toast.success(`Public link ${newState ? 'enabled' : 'disabled'}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle public link");
    } finally {
      setIsTogglingLink(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/report/${runId}`);
      toast.success("Public link copied to clipboard!");
    }
  };
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const mainMenuRef = React.useRef<HTMLDivElement>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningResultId, setAssigningResultId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  React.useEffect(() => {
    fetch(`/api/projects/${projectCode}/members`)
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setProjectMembers(data);
      })
      .catch(console.error);
  }, [projectCode]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target as Node)) {
        setMainMenuOpen(false);
      }
    };
    if (mainMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mainMenuOpen]);

  React.useEffect(() => {
    if (run?.status !== 'ACTIVE') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (res.ok) {
          const freshRun = await res.json();
          // Update the run state silently
          setRun(freshRun);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000); // poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [run?.status, runId]);

  const handleAssignClick = (resultId: string) => {
    setAssigningResultId(resultId);
    setIsAssignModalOpen(true);
  };

  const submitAssignee = async () => {
    if (!assigningResultId || !selectedAssigneeId) return;
    
    // Optimistic Update
    const updatedResults = run.results.map((r: any) => r.id === assigningResultId ? { ...r, assigneeId: selectedAssigneeId } : r);
    setRun({ ...run, results: updatedResults });
    setIsAssignModalOpen(false);
    
    try {
      await fetch(`/api/runs/${runId}/results/${assigningResultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: selectedAssigneeId }) 
      });
    } catch (err) {
      console.error(err);
    }
  };
  const handleOpenWizard = () => {
    // Find the first untested or failed result
    const firstResult = run.results.find((r: any) => r.status === 'IN_PROGRESS' || r.status === 'FAILED') || run.results[0];
    if (firstResult) {
      openResult(firstResult);
    }
  };

  const handleCompleteRun = async () => {
    try {
       const res = await fetch(`/api/runs/${runId}/complete`, { method: "POST" });
       if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || "Failed to complete run");
       }
       setIsCompleteModalOpen(false);
       router.push(`/projects/${projectCode}/runs`);
       router.refresh();
       toast.success("Run completed successfully!");
    } catch (e) {
       console.error(e);
       toast.error("Error completing run: " + e);
    }
  };

  const handleRunAutomation = async () => {
    if (!activeResultId) return;
    setIsExecutingAutomated(true);
    setAutomationLogs("Initializing Playwright Engine...\n");

    const currentResult = run.results.find((r: any) => r.id === activeResultId);
    if (!currentResult || !currentResult.testCase.automationScript) {
       setAutomationLogs("Error: No automation script found.\n");
       setIsExecutingAutomated(false);
       return;
    }

    try {
      setAutomationLogs(prev => prev + "Running npx playwright test...\n\n");
      const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/results/${activeResultId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: currentResult.testCase.automationScript })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute script");

      setAutomationLogs(data.logs);
      
      // Optimistically update status
      const newStatus = data.passed ? "PASSED" : "FAILED";
      updateResult(activeResultId, newStatus);

    } catch (err: any) {
      setAutomationLogs(prev => prev + `\nExecution Failed: ${err.message}`);
    } finally {
      setIsExecutingAutomated(false);
    }
  };
  const [isExecutingAllAutomated, setIsExecutingAllAutomated] = useState(false);
  const [automatedProgress, setAutomatedProgress] = useState({ current: 0, total: 0 });

  const handleRunAllAutomated = async () => {
    const automatedResults = run.results.filter((r: any) => 
      r.testCase?.automationStatus === 'AUTOMATED' && r.testCase?.automationScript
    );
    
    if (automatedResults.length === 0) {
      toast.error("No automated test cases with scripts found in this run.");
      return;
    }
    
    setIsExecutingAllAutomated(true);
    setAutomatedProgress({ current: 0, total: automatedResults.length });

    // Sequentially execute
    for (let i = 0; i < automatedResults.length; i++) {
      const currentResult = automatedResults[i];
      setAutomatedProgress({ current: i + 1, total: automatedResults.length });
      
      // Navigate UI to the currently running case so they can see logs stream
      openResult(currentResult);
      
      // We also set the automationLogs to indicate starting
      setIsExecutingAutomated(true);
      setAutomationLogs(`Bulk Execution (${i+1}/${automatedResults.length}): Starting Playwright...\n`);

      try {
        const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/results/${currentResult.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: currentResult.testCase.automationScript })
        });

        const data = await res.json();
        if (data.logs) {
           setAutomationLogs(data.logs);
        }
        
        if (data.passed !== undefined) {
           // We need to fetch the updated run result to get the new history, or just refresh the page.
           // For now, optimistically update the status.
           updateResult(currentResult.id, data.passed ? "PASSED" : "FAILED");
           
           // Fetch the fresh result to update history locally
           const freshRes = await fetch(`/api/runs/${runId}/results/${currentResult.id}`);
           if (freshRes.ok) {
             const freshResult = await freshRes.json();
             setRun((prev: any) => {
               const updated = prev.results.map((r: any) => r.id === currentResult.id ? freshResult : r);
               return { ...prev, results: updated };
             });
           }
        }
      } catch (err: any) {
        setAutomationLogs(`Error executing test: ${err.message}`);
      } finally {
        setIsExecutingAutomated(false);
      }
    }
    
    setIsExecutingAllAutomated(false);
  };
  const [isTriggeringGitHub, setIsTriggeringGitHub] = useState(false);

  const handleTriggerGitHub = async () => {
    if (!confirm("This will trigger the GitHub Actions workflow to run all automated tests in this run. Proceed?")) return;
    
    setIsTriggeringGitHub(true);
    
    // Optimistic UI update: Set to ACTIVE and IN_PROGRESS
    const updatedResults = run.results.map((r: any) => 
      r.testCase.automationStatus === 'AUTOMATED' 
        ? { ...r, status: 'IN_PROGRESS', comment: null } 
        : r
    );
    setRun({ ...run, status: 'ACTIVE', results: updatedResults });

    try {
      const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/github/dispatch`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger GitHub Actions");
      
    } catch (err: any) {
      toast.error(`Error triggering GitHub: ${err.message}`);
    } finally {
      setIsTriggeringGitHub(false);
    }
  };

  // Tree computation
  const { roots, childrenMap } = useMemo(() => {
    const cMap = new Map<string, any[]>();
    const rootList: any[] = [];
    suites.forEach(suite => cMap.set(suite.id, []));
    suites.forEach(suite => {
      if (suite.parentId && cMap.has(suite.parentId)) {
        cMap.get(suite.parentId)!.push(suite);
      } else {
        rootList.push(suite);
      }
    });
    return { roots: rootList, childrenMap: cMap };
  }, [suites]);

  const resultsBySuiteId = useMemo(() => {
    const grouped = new Map<string, any[]>();
    run.results.forEach((r: any) => {
      const sId = r.testCase?.suiteId || 'unassigned';
      if (!grouped.has(sId)) grouped.set(sId, []);
      grouped.get(sId)!.push(r);
    });
    return grouped;
  }, [run.results]);

  const computeSuiteStats = (suiteId: string): any => {
    let stats = { passed: 0, failed: 0, blocked: 0, skipped: 0, untested: 0, total: 0 };
    const cases = resultsBySuiteId.get(suiteId) || [];
    cases.forEach(c => {
       stats.total++;
       if (c.status === 'PASSED') stats.passed++;
       else if (c.status === 'FAILED') stats.failed++;
       else if (c.status === 'BLOCKED') stats.blocked++;
       else if (c.status === 'SKIPPED') stats.skipped++;
       else stats.untested++;
    });
    const children = childrenMap.get(suiteId) || [];
    children.forEach(child => {
        const childStats = computeSuiteStats(child.id);
        stats.total += childStats.total;
        stats.passed += childStats.passed;
        stats.failed += childStats.failed;
        stats.blocked += childStats.blocked;
        stats.skipped += childStats.skipped;
        stats.untested += childStats.untested;
    });
    return stats;
  };

  const runStats = useMemo(() => {
    let stats = { passed: 0, failed: 0, blocked: 0, skipped: 0, untested: 0, total: run.results.length };
    run.results.forEach((r: any) => {
       if (r.status === 'PASSED') stats.passed++;
       else if (r.status === 'FAILED') stats.failed++;
       else if (r.status === 'BLOCKED') stats.blocked++;
       else if (r.status === 'SKIPPED') stats.skipped++;
       else stats.untested++;
    });
    return stats;
  }, [run.results]);
  
  const completionRate = runStats.total > 0 ? Math.round(((runStats.total - runStats.untested) / runStats.total) * 100) : 0;

  const renderConicGradient = () => {
    if (runStats.total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    const passed = (runStats.passed / runStats.total) * 100;
    const failed = (runStats.failed / runStats.total) * 100;
    const blocked = (runStats.blocked / runStats.total) * 100;
    const skipped = (runStats.skipped / runStats.total) * 100;
    const untested = (runStats.untested / runStats.total) * 100;
    
    let current = 0;
    let gradient = 'conic-gradient(';
    
    if (passed > 0) {
      gradient += `#22c55e ${current}% ${current + passed}%, `;
      current += passed;
    }
    if (failed > 0) {
      gradient += `#ef4444 ${current}% ${current + failed}%, `;
      current += failed;
    }
    if (blocked > 0) {
      gradient += `#f97316 ${current}% ${current + blocked}%, `;
      current += blocked;
    }
    if (skipped > 0) {
      gradient += `#94a3b8 ${current}% ${current + skipped}%, `;
      current += skipped;
    }
    if (untested > 0) {
      gradient += `#334155 ${current}% ${current + untested}%`;
    }
    
    if (gradient.endsWith(', ')) gradient = gradient.slice(0, -2);
    gradient += ')';
    
    return gradient;
  };

  const toggleSuite = (suiteId: string) => {
    setExpandedSuites(prev => ({ ...prev, [suiteId]: !prev[suiteId] }));
  };

  const openResult = (result: any) => {
    setActiveResultId(result.id);
    if (result.stepResults) {
      setStepResults(result.stepResults);
    } else {
      setStepResults({});
    }
  };

  const updateResult = async (resultId: string, status: string) => {
    try {
      // Optimistic Update
      setRun((prev: any) => {
        const updatedResults = prev.results.map((r: any) => 
          r.id === resultId ? { ...r, status } : r
        );
        return { ...prev, results: updatedResults };
      });

      // Actual fetch to update DB
      await fetch(`/api/runs/${runId}/results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const updateStepResult = async (stepId: string, updates: any) => {
    const newStepResults = {
      ...stepResults,
      [stepId]: { ...(stepResults[stepId] || {}), ...updates }
    };
    setStepResults(newStepResults);
    
    const currentActiveResult = run?.results.find((r: any) => r.id === activeResultId);
    let newGlobalStatus = currentActiveResult?.status;
    const testCase = currentActiveResult?.testCase;
    
    if (testCase && testCase.steps && testCase.steps.length > 0) {
      const stepStatuses = testCase.steps.map((s: any) => newStepResults[s.id]?.status);
      if (stepStatuses.includes("FAILED")) {
        newGlobalStatus = "FAILED";
      } else if (stepStatuses.includes("BLOCKED")) {
        newGlobalStatus = "BLOCKED";
      } else if (stepStatuses.every((st: any) => st === "PASSED")) {
        newGlobalStatus = "PASSED";
      } else {
        newGlobalStatus = "IN_PROGRESS";
      }
    }

    if (run && activeResultId) {
      const updatedResults = run.results.map((r: any) => 
        r.id === activeResultId ? { ...r, stepResults: newStepResults, status: newGlobalStatus } : r
      );
      setRun({ ...run, results: updatedResults });
    }

    try {
      await fetch(`/api/runs/${runId}/results/${activeResultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepResults: newStepResults, status: newGlobalStatus })
      });
    } catch(err) {
      console.error("Failed to save step result", err);
    }
  };

  const handleFileUpload = async (stepId: string, file: File) => {
    if (!file) return;
    setUploadingStepId(stepId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectCode);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const currentAtts = stepResults[stepId]?.attachments || [];
      const newAtts = [...currentAtts, { url: data.url, name: file.name }];
      updateStepResult(stepId, { attachments: newAtts });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingStepId(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, stepId: string) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileUpload(stepId, file);
          break;
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PASSED": return "bg-emerald-500 text-white";
      case "FAILED": return "bg-red-500 text-white";
      case "BLOCKED": return "bg-orange-500 text-white";
      case "SKIPPED": return "bg-slate-400 text-white";
      default: return "bg-surface-hover text-text-muted border border-border";
    }
  };

  const renderProgressBar = (stats: any) => {
    if (stats.total === 0) return null;
    const passedPct = (stats.passed / stats.total) * 100;
    const failedPct = (stats.failed / stats.total) * 100;
    const blockedPct = (stats.blocked / stats.total) * 100;
    const skippedPct = (stats.skipped / stats.total) * 100;
    
    return (
      <div className="flex h-2 w-48 rounded bg-background overflow-hidden ml-4 border border-border/50">
        {stats.passed > 0 && <div style={{ width: `${passedPct}%` }} className="bg-emerald-500" />}
        {stats.failed > 0 && <div style={{ width: `${failedPct}%` }} className="bg-red-500" />}
        {stats.blocked > 0 && <div style={{ width: `${blockedPct}%` }} className="bg-orange-500" />}
        {stats.skipped > 0 && <div style={{ width: `${skippedPct}%` }} className="bg-slate-400" />}
      </div>
    );
  };

  const renderResultRow = (result: any, depth: number) => {
    const isSelected = activeResultId === result.id;
    return (
      <ResultRow 
        key={result.id} 
        result={result} 
        depth={depth} 
        isSelected={isSelected} 
        openResult={openResult} 
        projectCode={projectCode}
        runId={runId}
        onDelete={(id: string) => {
           setRun({ ...run, results: run.results.filter((r: any) => r.id !== id) });
        }}
        onUpdateAssignee={(id: string, assigneeId: string | null) => {
           const updatedResults = run.results.map((r: any) => r.id === id ? { ...r, assigneeId } : r);
           setRun({ ...run, results: updatedResults });
        }}
        onAssignClick={handleAssignClick}
      />
    );
  };

  const renderSuiteTree = (suite: any, depth: number) => {
    const stats = computeSuiteStats(suite.id);
    if (stats.total === 0) return null; // hide suites with no results

    const isExpanded = expandedSuites[suite.id] !== false; // default true
    const results = resultsBySuiteId.get(suite.id) || [];
    const children = childrenMap.get(suite.id) || [];

    return (
      <div key={suite.id} className="flex flex-col">
        <div 
          className="flex items-center py-3 border-b border-border/50 bg-surface hover:bg-surface-hover cursor-pointer group transition-colors"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
          onClick={() => toggleSuite(suite.id)}
        >
          <div className="w-5 flex items-center justify-center mr-1 text-text-muted">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <input type="checkbox" className="w-4 h-4 mr-3 rounded border-border text-primary focus:ring-primary/20" onClick={e => e.stopPropagation()} />
          <span className="font-bold text-text-main text-[15px] mr-3 group-hover:text-primary transition-colors">{suite.title}</span>
          
          <div className="flex items-center text-xs text-text-muted font-medium whitespace-nowrap">
            {renderProgressBar(stats)}
            <Clock size={12} className="ml-3 mr-1" />
            2h 52m
          </div>
        </div>
        
        {isExpanded && (
          <div className="flex flex-col">
            {results.map(r => renderResultRow(r, depth + 1))}
            {children.map(child => renderSuiteTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const activeResult = run.results.find((r: any) => r.id === activeResultId);
  const unassignedResults = resultsBySuiteId.get('unassigned') || [];

  const exportToCSV = () => {
    const headers = [
      "Case Code",
      "Test Case Title",
      "Status",
      "Severity",
      "Priority",
      "Expected Result",
      "Actual Result",
      "Evidence (URLs)",
      "Error Message",
      "Time Spent (s)",
      "Executed Date"
    ];

    const escapeCSV = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = run.results.map((res: any) => {
      const tc = res.testCase;
      const code = tc.code || `${projectCode}-${tc.id.substring(0, 4)}`;

      const expected = (tc.steps || []).map((step: any, idx: number) => {
        const stepNum = idx + 1;
        let text = `${stepNum}. Action: ${step.action}`;
        if (step.expectedResult) text += `\n   Expected: ${step.expectedResult}`;
        return text;
      }).join('\n\n');

      const actual = (tc.steps || []).map((step: any, idx: number) => {
        const stepNum = idx + 1;
        const stepRes = (res.stepResults && res.stepResults[step.id]) || {};
        const status = stepRes.status ? `[${stepRes.status}]` : '';
        let text = `${stepNum}. ${status}`;
        if (stepRes.actualResult) text += ` Actual: ${stepRes.actualResult}`;
        return text;
      }).join('\n\n');

      const evidenceUrls: string[] = [];
      if (res.attachments && Array.isArray(res.attachments)) {
        evidenceUrls.push(...res.attachments.map((a: any) => a.url));
      }
      (tc.steps || []).forEach((step: any) => {
        const stepRes = (res.stepResults && res.stepResults[step.id]) || {};
        if (stepRes.attachments && Array.isArray(stepRes.attachments)) {
          evidenceUrls.push(...stepRes.attachments.map((a: any) => a.url));
        }
      });
      const evidence = evidenceUrls.join('\n');

      const date = res.updatedAt ? formatThaiTime(res.updatedAt) : '';
      const timeSpent = res.timeSpent ? (res.timeSpent / 1000).toFixed(1) : '0';

      return [
        escapeCSV(code),
        escapeCSV(tc.title),
        escapeCSV(res.status),
        escapeCSV(tc.severity),
        escapeCSV(tc.priority),
        escapeCSV(expected),
        escapeCSV(actual),
        escapeCSV(evidence),
        escapeCSV(res.errorMessage || res.comment),
        escapeCSV(timeSpent),
        escapeCSV(date)
      ].join(',');
    });

    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const cleanTitle = run.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `run_${cleanTitle}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const exportToPDF = async () => {
    setIsExportingPdf(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      if (typeof html2canvas !== 'function') throw new Error('html2canvas is not a function');
      
      const jsPdfModule = await import('jspdf');
      const jsPDF = jsPdfModule.jsPDF || jsPdfModule.default;
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1000px';
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<PdfReportTemplate run={run} projectCode={projectCode} />);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Find the table header to repeat on every page
      const thead = container.querySelector('thead');
      let headerHeightPx = 0;
      let headerImgData: string | null = null;
      let headerPdfHeight = 0;

      if (thead) {
        const theadRect = thead.getBoundingClientRect();
        headerHeightPx = theadRect.height;
        
        const headerCanvas = await html2canvas(thead as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#1e293b' // Matches thead background
        });
        headerImgData = headerCanvas.toDataURL('image/jpeg', 0.95);
      }

      // Find all rows to calculate page breaks
      const trs = container.querySelectorAll('.page-break-avoid, tbody tr');
      const pageHeightPx = (297 / 210) * 1000; // ~1414px
      let currentLimit = pageHeightPx;
      const sliceOffsets = [0];

      trs.forEach(tr => {
        const rect = tr.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const yTop = rect.top - containerRect.top;
        const yBottom = rect.bottom - containerRect.top;

        if (yBottom > currentLimit && yTop < currentLimit) {
          // This element crosses the page boundary
          // We break just before this element, so we push its top coordinate
          const lastBreak = sliceOffsets[sliceOffsets.length - 1];
          if (yTop > lastBreak + 100) { 
            sliceOffsets.push(yTop);
            // Next page will have a header injected at the top, so we subtract its height
            // from the available content area limit.
            currentLimit = yTop + (pageHeightPx - headerHeightPx);
          }
        }
      });

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      const ratio = pdfWidth / canvas.width;
      
      if (headerImgData && thead) {
        // The header canvas width is scaled, so its height ratio is the same
        headerPdfHeight = (headerHeightPx * 2) * ratio;
      }

      for (let i = 0; i < sliceOffsets.length; i++) {
        if (i > 0) pdf.addPage();
        
        const sourceY = sliceOffsets[i] * 2; // scale is 2
        let pdfY = -(sourceY * ratio);
        
        if (i > 0 && headerImgData) {
          // Shift content down by the header height
          pdfY += headerPdfHeight;
        }
        
        pdf.addImage(imgData, 'JPEG', 0, pdfY, pdfWidth, canvas.height * ratio);
        
        if (i > 0 && headerImgData) {
          // Hide the bleed-over content at the top
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, headerPdfHeight, 'F');
          
          // Draw the repeating header
          pdf.addImage(headerImgData, 'JPEG', 0, 0, pdfWidth, headerPdfHeight);
        }
        
        // Hide the overflow at the bottom to avoid showing cut rows
        const nextSourceY = (i < sliceOffsets.length - 1) ? sliceOffsets[i+1] * 2 : canvas.height;
        let contentPdfHeight = (nextSourceY - sourceY) * ratio;
        
        if (i > 0 && headerImgData) {
          contentPdfHeight += headerPdfHeight;
        }
        
        if (contentPdfHeight < pdfHeight) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, contentPdfHeight, pdfWidth, pdfHeight - contentPdfHeight, 'F');
        }
      }

      const cleanTitle = run.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`run_${cleanTitle}_${dateStr}.pdf`);
      
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      
      setIsExportModalOpen(false);
      toast.success("PDF Report generated successfully");
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      toast.error(`Failed to generate PDF: ${err.message || String(err)}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
    {isReportModalOpen && run.reportUrl && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-border overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-lg font-bold text-text-main flex items-center">
              <BarChart2 size={18} className="mr-2 text-primary" /> Playwright HTML Report
            </h2>
            <button onClick={() => setIsReportModalOpen(false)} className="text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 w-full bg-surface relative">
            {/* The Playwright report has its own white background */}
            <iframe 
              src={run.reportUrl} 
              className="w-full h-full border-0 absolute inset-0"
              title="Playwright Report"
            />
          </div>
        </div>
      </div>
    )}

    <div className="flex h-[calc(100vh-4rem)] w-full bg-background overflow-hidden relative transition-colors">
      {/* Main Suite/Case Tree View */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface border-r border-border transition-colors">
        <header className="px-8 pt-8 pb-4 border-b border-border/50">
          <div className="flex items-center text-sm text-text-muted hover:text-text-main cursor-pointer transition-colors mb-4" onClick={() => router.push(`/projects/${projectCode}/runs`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to runs
          </div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-main">{run.title}</h1>
            <div className="flex space-x-2">
              {run.reportUrl && (
                <button 
                  onClick={() => setIsReportModalOpen(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                >
                  <BarChart2 size={14} className="mr-2" /> View Report
                </button>
              )}
              <button 
                onClick={handleTriggerGitHub} 
                disabled={isTriggeringGitHub}
                className="bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center shadow-[0_0_10px_rgba(35,134,54,0.4)] disabled:opacity-50"
              >
                {isTriggeringGitHub ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Terminal size={14} className="mr-2" />} 
                {isTriggeringGitHub ? `Triggering...` : "Trigger GitHub Action"}
              </button>
              <button 
                onClick={handleRunAllAutomated} 
                disabled={isExecutingAllAutomated || process.env.NEXT_PUBLIC_IS_DEMO === 'true'}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center shadow-[0_0_10px_rgba(245,158,11,0.4)] disabled:opacity-50"
                title={process.env.NEXT_PUBLIC_IS_DEMO === 'true' ? "Local Playwright execution is disabled in Vercel Demo mode" : ""}
              >
                {isExecutingAllAutomated ? <Loader2 size={14} className="mr-2 animate-spin" /> : <PlayCircle size={14} className="mr-2" />} 
                {isExecutingAllAutomated ? `Running (${automatedProgress.current}/${automatedProgress.total})` : "Run Local"}
              </button>
              <button onClick={handleOpenWizard} className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center shadow-sm">
                <PlayCircle size={14} className="mr-2" /> Open wizard
              </button>
              <button onClick={() => setIsCompleteModalOpen(true)} className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center shadow-sm">
                <Check size={14} className="mr-2" /> Complete
              </button>
              <div className="relative" ref={mainMenuRef}>
                <button 
                  onClick={() => setMainMenuOpen(!mainMenuOpen)} 
                  className="bg-background border border-border hover:bg-surface-hover text-text-main px-2 py-1.5 rounded text-sm font-bold transition-colors flex items-center"
                >
                  <MoreHorizontal size={14} />
                </button>
                {mainMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface dark:bg-[#1C1C1C] border border-border rounded-md shadow-lg z-50 overflow-hidden">
                    <button 
                      onClick={() => { setIsShareModalOpen(true); setMainMenuOpen(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
                    >
                      <Share size={14} className="mr-2 text-text-muted" /> Share report
                    </button>
                    <button 
                      onClick={() => { setIsExportModalOpen(true); setMainMenuOpen(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors border-b border-border"
                    >
                      <Download size={14} className="mr-2 text-text-muted" /> Export
                    </button>
                    <button 
                      onClick={() => router.push(`/projects/${projectCode}/runs/${runId}/edit`)} 
                      className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
                    >
                      <Edit size={14} className="mr-2 text-text-muted" /> Edit run
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 border-b border-border/50">
            <div className="pb-3 border-b-2 border-primary text-primary font-semibold text-sm cursor-pointer transition-colors">
              Test cases
            </div>
          </div>
        </header>
        
        {/* Tree Header */}
        <div className="bg-surface border-b border-border/50 px-8 py-3 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 relative transition-colors">
          <div className="flex space-x-2 w-96">
            <input type="text" placeholder="Search..." className="flex-1 px-3 py-1.5 text-sm border-none bg-background text-text-main rounded focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors" />
            <select className="px-3 py-1.5 text-sm border-none bg-background text-text-main rounded focus:outline-none transition-colors">
              <option>By all fields</option>
            </select>
            <button className="text-primary text-sm font-medium hover:underline whitespace-nowrap ml-2">Add filter</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          {unassignedResults.length > 0 && (
            <div className="flex flex-col">
              <div className="flex items-center py-3 border-b border-border/50 bg-surface hover:bg-surface-hover cursor-pointer group px-4 transition-colors">
                 <span className="font-bold text-text-main text-[15px] mr-3">Unassigned Cases</span>
              </div>
              {unassignedResults.map(r => renderResultRow(r, 0))}
            </div>
          )}
          {roots.map(suite => renderSuiteTree(suite, 0))}
        </div>
      </main>

      {/* Right Sidebar: Run Details & Progress */}
      <aside className="w-80 shrink-0 bg-surface flex flex-col overflow-y-auto transition-colors">
        <div className="p-8 flex flex-col items-center border-b border-border/50 mt-4">
          <div className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)]" style={{ background: renderConicGradient() }}>
            <div className="w-40 h-40 bg-surface rounded-full flex flex-col items-center justify-center absolute shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] transition-colors">
               <span className="text-xs text-text-muted font-medium mb-1">Completion rate</span>
               <span className="text-4xl font-bold text-text-main">{completionRate}%</span>
               <span className="text-xs text-text-muted mt-1">{runStats.total - runStats.untested} of {runStats.total}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 text-sm">
          <div>
            <div className="font-bold text-text-main mb-1">Status</div>
            <div className="flex items-center text-text-muted">
               {completionRate === 100 ? (
                 <><CheckCircle2 size={16} className="text-emerald-500 mr-2" /> Completed</>
               ) : (
                 <><RefreshCw size={16} className="text-primary mr-2" /> In Progress</>
               )}
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Started by</div>
            <div className="flex items-center text-text-muted">
               <div className="w-5 h-5 rounded bg-[#b87c88] text-white text-[10px] flex items-center justify-center font-bold mr-2">SA</div>
               System Admin
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Estimation</div>
            <div className="flex items-center text-text-muted">
               <Clock size={14} className="mr-2 opacity-70" />
               25s 762ms
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Started at</div>
            <div className="flex items-center text-text-muted">
               <Clock size={14} className="mr-2 opacity-70" />
               {formatThaiTime(run.createdAt)}
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Total Time</div>
            <div className="flex items-center text-text-muted">
               <Clock size={14} className="mr-2 opacity-70" />
               6s 436ms
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Elapsed Time</div>
            <div className="flex items-center text-text-muted">
               <Clock size={14} className="mr-2 opacity-70" />
               4m 33s
            </div>
          </div>
          <div>
            <div className="font-bold text-text-main mb-1">Environment</div>
            <div className="text-text-muted">{(run as any).environment?.title || "Not specified"}</div>
          </div>
          {(run as any).milestone && (
            <div>
              <div className="font-bold text-text-main mb-1">Milestone</div>
              <div className="text-text-muted">{(run as any).milestone.title}</div>
            </div>
          )}
          <div>
            <div className="font-bold text-text-main mb-1">External issue</div>
            <button className="w-full py-2 bg-background border border-border hover:bg-surface-hover text-text-main font-bold rounded-md transition-colors mt-1 text-sm shadow-sm">
              Select an integration
            </button>
          </div>
        </div>
      </aside>

      {/* Slide-over Execution Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[55vw] min-w-[600px] bg-surface shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${activeResultId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {activeResult && activeResult.testCase && (
          <>
            <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-surface shrink-0">
              <div className="flex items-center space-x-3 truncate">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(activeResult.status)}`}>
                  {activeResult.status === "PASSED" && <CheckCircle2 size={12} />}
                  {activeResult.status === "FAILED" && <XCircle size={12} />}
                  {activeResult.status === "BLOCKED" && <MinusCircle size={12} />}
                </div>
                <h2 className="text-lg font-bold text-text-main truncate">{activeResult.testCase.title}</h2>
                <span className="text-sm text-text-muted font-mono shrink-0">{projectCode}-{activeResult.testCase.id.substring(0,4).toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-2 ml-4 shrink-0">
                 <button className="text-text-muted hover:text-text-main p-2"><Edit3 size={18}/></button>
                 <button className="text-text-muted hover:text-text-main p-2"><VolumeX size={18}/></button>
                 <button onClick={() => setActiveResultId(null)} className="text-text-muted hover:text-red-500 p-2"><X size={20}/></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 border-b border-border/50 flex space-x-4 bg-background/50">
                 <button className="bg-surface border border-border hover:bg-surface-hover text-text-main px-3 py-1.5 rounded text-sm font-semibold flex items-center transition-colors">
                   <RefreshCw size={14} className="mr-2 text-text-muted" /> Run again
                 </button>
                 <button className="bg-surface border border-border hover:bg-surface-hover text-text-main px-3 py-1.5 rounded text-sm font-semibold flex items-center transition-colors">
                   <Settings size={14} className="mr-2 text-text-muted" /> Automate
                 </button>
              </div>
              
              <div className="border-b border-border/50 px-6">
                <div className="flex space-x-6">
                  <button className="pb-3 pt-4 border-b-2 border-primary text-primary font-bold text-sm">Execution</button>
                  <button className="pb-3 pt-4 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Run History</button>
                  <button className="pb-3 pt-4 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Retries</button>
                </div>
              </div>

              {/* Global Status Buttons */}
              <div className="px-6 py-6 border-b border-border/50">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => updateResult(activeResult.id, "PASSED")} 
                    className={`px-4 py-1.5 text-sm font-bold rounded border transition ${activeResult.status === 'PASSED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-surface text-emerald-600 border-border hover:bg-surface-hover'}`}
                  >
                    <CheckCircle2 size={16} className="inline mr-1.5 -mt-0.5" />Passed
                  </button>
                  <button 
                    onClick={() => updateResult(activeResult.id, "FAILED")} 
                    className={`px-4 py-1.5 text-sm font-bold rounded border transition ${activeResult.status === 'FAILED' ? 'bg-[#de350b] text-white border-[#de350b]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                  >
                    <XCircle size={16} className="inline mr-1.5 -mt-0.5" />Failed
                  </button>
                  <button 
                    onClick={() => updateResult(activeResult.id, "BLOCKED")} 
                    className={`px-4 py-1.5 text-sm font-bold rounded border transition ${activeResult.status === 'BLOCKED' ? 'bg-[#ff991f] text-white border-[#ff991f]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                  >
                    <MinusCircle size={16} className="inline mr-1.5 -mt-0.5" />Blocked
                  </button>
                  <button 
                    onClick={() => updateResult(activeResult.id, "SKIPPED")} 
                    className={`px-4 py-1.5 text-sm font-bold rounded border transition ${activeResult.status === 'SKIPPED' ? 'bg-[#97a0af] text-white border-[#97a0af]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                  >
                    Skipped
                  </button>
                  <button 
                    className={`px-4 py-1.5 text-sm font-bold rounded border transition ${activeResult.status === 'INVALID' ? 'bg-[#6554c0] text-white border-[#6554c0]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                  >
                    Invalid
                  </button>
                </div>
              </div>

              {/* Case Details */}
              <div className="px-6 py-6 border-b border-border/50 flex">
                 <div className="flex-1 pr-6 border-r border-border/50">
                    <h3 className="text-sm font-bold text-text-main mb-2">Description</h3>
                    <p className="text-[15px] text-text-muted leading-relaxed mb-6">
                      {activeResult.testCase.description || "No description provided."}
                    </p>
                    <h3 className="text-sm font-bold text-text-main mb-2">Pre-conditions</h3>
                    <div className="text-[15px] text-text-muted leading-relaxed mb-6">
                      {activeResult.testCase.preconditions ? (
                        <div dangerouslySetInnerHTML={{ __html: activeResult.testCase.preconditions }} />
                      ) : (
                        "None"
                      )}
                    </div>
                 </div>
                 <div className="w-56 pl-6 shrink-0 text-sm space-y-4">
                    <div>
                      <div className="font-bold text-text-main mb-1">Executed by</div>
                      <div className="flex items-center text-text-muted">
                         <div className="w-5 h-5 rounded bg-[#b87c88] text-white text-[10px] flex items-center justify-center font-bold mr-2">SA</div>
                         System Admin
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-text-main mb-1">Started at</div>
                      <div className="text-text-muted">{formatThaiTime(activeResult.createdAt)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-text-main mb-1">Environment</div>
                      <div className="text-text-muted">{(run as any).environment?.title || "Not specified"}</div>
                    </div>
                 </div>
              </div>

              {/* Steps List or Automation Terminal */}
              <div className="px-6 py-4 pb-20">
                {activeResult.testCase.automationStatus === 'AUTOMATED' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-text-main text-lg flex items-center">
                         <Terminal className="mr-2 text-primary" size={20} />
                         Automated Execution
                       </h3>
                       <button 
                         onClick={handleRunAutomation}
                         disabled={isExecutingAutomated || process.env.NEXT_PUBLIC_IS_DEMO === 'true'}
                         className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-bold shadow-sm transition-all disabled:opacity-50"
                         title={process.env.NEXT_PUBLIC_IS_DEMO === 'true' ? "Playwright is disabled in Demo Mode" : ""}
                       >
                         {isExecutingAutomated ? <Loader2 size={16} className="mr-2 animate-spin" /> : <PlayCircle size={16} className="mr-2" />}
                         {isExecutingAutomated ? "Executing..." : "Run Automation"}
                       </button>
                    </div>
                    
                    <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
                       <div className="bg-[#161b22] px-4 py-2 border-b border-slate-800 flex items-center">
                         <div className="flex space-x-2">
                           <div className="w-3 h-3 rounded-full bg-red-500"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500"></div>
                         </div>
                         <div className="ml-4 text-xs font-mono text-text-muted">playwright execution log</div>
                       </div>
                       <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                         {!automationLogs ? (
                           <div className="text-text-muted font-mono text-sm">
                             Ready to execute. Click "Run Automation" to start.
                             <div className="mt-4 opacity-50">
                               <pre>{activeResult.testCase.automationScript}</pre>
                             </div>
                           </div>
                         ) : (
                           <pre className="font-mono text-sm text-[#c9d1d9] whitespace-pre-wrap">{automationLogs}</pre>
                         )}
                       </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                      <div className="text-sm font-bold text-text-main flex items-center">
                        <FileText size={16} className="mr-2 text-text-muted" /> Artifacts
                      </div>
                      <button 
                        onClick={() => setViewingAttachment({ url: "https://demo.playwright.dev/reports/todomvc/data/e6099cadf79aa753d5500aa9508f9d1dbd87b5ee.zip", name: "Playwright Trace", isTrace: true })}
                        className="flex items-center px-4 py-2 bg-slate-900 text-slate-300 border border-slate-700 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <FileText size={16} className="mr-2 text-primary" />
                        View Latest Trace
                      </button>
                    </div>

                    {activeResult.executionHistory && activeResult.executionHistory.length > 0 && (
                      <div className="mt-6 border border-border rounded-lg overflow-hidden bg-background">
                        <div className="bg-surface px-4 py-3 border-b border-border font-bold text-sm text-text-main flex items-center">
                           <Clock size={16} className="mr-2 text-text-muted" />
                           Execution History
                        </div>
                        <div className="divide-y divide-border">
                          {[...activeResult.executionHistory].reverse().map((historyItem: any, i: number) => (
                             <details key={i} className="group">
                               <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors">
                                 <div className="flex items-center space-x-3">
                                   <div className={`w-2 h-2 rounded-full ${historyItem.status === 'PASSED' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                   <span className="text-sm font-medium text-text-main">
                                     {formatThaiTime(historyItem.timestamp)}
                                   </span>
                                 </div>
                                 <span className="text-xs text-text-muted group-open:hidden">View Logs</span>
                                 <span className="text-xs text-text-muted hidden group-open:block">Hide Logs</span>
                               </summary>
                               <div className="px-4 py-3 bg-[#0d1117] border-t border-border">
                                 <pre className="font-mono text-xs text-[#c9d1d9] whitespace-pre-wrap">{historyItem.logs}</pre>
                               </div>
                             </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeResult.testCase.steps && activeResult.testCase.steps.length > 0 ? (
                  <div className="space-y-0">
                    {activeResult.testCase.steps.map((step: any, idx: number) => {
                      const stepData = stepResults[step.id] || {};
                      const stepStatus = stepData.status;
                      const actualResult = stepData.actualResult || "";
                      const attachments = stepData.attachments || [];
                      
                      return (
                        <div key={step.id} className="flex py-6 border-b border-border/50 last:border-0">
                          <div className="w-8 shrink-0">
                            <div className="w-6 h-6 rounded bg-background flex items-center justify-center text-text-muted font-bold text-xs">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1 space-y-4 max-w-full">
                            <div className="text-[15px] text-text-main whitespace-pre-wrap">{step.action}</div>
                            
                            <div className="flex space-x-2 pt-1">
                              <button 
                                onClick={() => updateStepResult(step.id, { status: "PASSED" })} 
                                className={`px-3 py-1 text-xs font-bold rounded border transition ${stepStatus === 'PASSED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-surface text-emerald-600 border-border hover:bg-surface-hover'}`}
                              >
                                <CheckCircle2 size={12} className="inline mr-1 -mt-0.5"/>Passed
                              </button>
                              <button 
                                onClick={() => updateStepResult(step.id, { status: "FAILED" })} 
                                className={`px-3 py-1 text-xs font-bold rounded border transition ${stepStatus === 'FAILED' ? 'bg-[#de350b] text-white border-[#de350b]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                              >
                                <XCircle size={12} className="inline mr-1 -mt-0.5"/>Failed
                              </button>
                              <button 
                                onClick={() => updateStepResult(step.id, { status: "BLOCKED" })} 
                                className={`px-3 py-1 text-xs font-bold rounded border transition ${stepStatus === 'BLOCKED' ? 'bg-[#ff991f] text-white border-[#ff991f]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                              >
                                <MinusCircle size={12} className="inline mr-1 -mt-0.5"/>Blocked
                              </button>
                              <button 
                                onClick={() => updateStepResult(step.id, { status: "SKIPPED" })} 
                                className={`px-3 py-1 text-xs font-bold rounded border transition ${stepStatus === 'SKIPPED' ? 'bg-[#97a0af] text-white border-[#97a0af]' : 'bg-surface text-text-muted border-border hover:bg-surface-hover'}`}
                              >
                                Skipped
                              </button>
                            </div>
                            
                            <div className="pt-1">
                              <div className="text-sm font-bold text-text-main mb-2">Actual result</div>
                              <textarea 
                                value={actualResult}
                                onChange={(e) => setStepResults({...stepResults, [step.id]: {...stepData, actualResult: e.target.value}})}
                                onBlur={(e) => updateStepResult(step.id, { actualResult: e.target.value })}
                                onPaste={(e) => handlePaste(e, step.id)}
                                className="w-full text-sm bg-background text-text-main border border-border rounded-md p-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                                placeholder="Paste image here or select from attachment..."
                              />
                            </div>
  
                            {attachments.length > 0 && (
                              <div className="flex flex-wrap gap-3 pt-2">
                                {attachments.map((att: any, i: number) => (
                                  <div 
                                    key={i} 
                                    className="relative w-48 h-32 border border-border rounded-md overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-background flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                                    onClick={() => setViewingAttachment({ url: att.url, name: att.name || "Attachment" })}
                                  >
                                    {att.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                      <video src={att.url} className="w-full h-full object-contain bg-black" />
                                    ) : att.url?.match(/\.(zip|pdf|csv|txt|doc|docx|xls|xlsx)$/i) ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-hover text-text-muted">
                                        <FileText size={32} className="mb-2" />
                                        <span className="text-xs font-medium px-2 text-center truncate w-full">{att.name || "File"}</span>
                                      </div>
                                    ) : (
                                      <img src={att.url} alt={att.name || "Attachment"} className="w-full h-full object-contain" />
                                    )}
                                    <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         const newAtts = attachments.filter((_: any, index: number) => index !== i);
                                         updateStepResult(step.id, { attachments: newAtts });
                                      }}
                                      className="absolute top-1.5 right-1.5 bg-surface text-red-500 rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 z-10"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
  
                            <div className="pt-1">
                              <input 
                                type="file" 
                                id={`file-upload-${step.id}`}
                                className="hidden" 
                                accept="image/*,video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(step.id, file);
                                    e.target.value = '';
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`file-upload-${step.id}`}
                                className="text-primary text-[13px] font-bold hover:underline flex items-center cursor-pointer w-fit transition-colors"
                              >
                                <span className="text-lg mr-1.5 leading-none mb-0.5">+</span> Add attachment
                                {uploadingStepId === step.id && <RefreshCw size={12} className="ml-2 animate-spin text-text-muted" />}
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-text-muted text-[15px]">No steps defined.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Attachment Viewer */}
      {viewingAttachment && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setViewingAttachment(null)}
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <button 
              onClick={() => setViewingAttachment(null)}
              className="bg-surface/10 hover:bg-surface/20 text-white rounded-full p-2 transition backdrop-blur-sm"
            >
              <XCircle size={32} />
            </button>
          </div>
          <div 
            className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-200 p-8 pt-16"
            onClick={(e) => e.stopPropagation()}
          >
            {viewingAttachment.url?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={viewingAttachment.url} controls autoPlay className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-black" />
            ) : viewingAttachment.isTrace ? (
              <div className="w-full h-full bg-surface rounded-lg overflow-hidden shadow-2xl flex flex-col">
                 <div className="bg-surface-hover border-b border-border px-4 py-3 flex items-center">
                    <span className="text-sm font-bold text-text-main flex items-center">
                       <img src="https://playwright.dev/img/playwright-logo.svg" className="w-5 h-5 mr-2" alt="Playwright" />
                       Playwright Trace Viewer
                    </span>
                 </div>
                 <iframe 
                   src={`https://trace.playwright.dev/?trace=${encodeURIComponent(viewingAttachment.url)}`} 
                   className="w-full flex-1 border-none"
                   title="Playwright Trace Viewer"
                 />
              </div>
            ) : viewingAttachment.url?.match(/\.(zip|pdf|csv|txt|doc|docx|xls|xlsx)$/i) ? (
              <div className="bg-surface p-12 rounded-lg shadow-2xl flex flex-col items-center justify-center border border-border min-w-[300px]">
                 <FileText size={48} className="text-text-muted mb-4" />
                 <h3 className="text-lg font-bold text-text-main mb-6 text-center break-all max-w-sm">{viewingAttachment.name}</h3>
                 <a 
                   href={viewingAttachment.url} 
                   download 
                   target="_blank" 
                   rel="noreferrer"
                   className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary-hover transition-colors shadow-sm"
                 >
                   Download File
                 </a>
              </div>
            ) : (
              <img src={viewingAttachment.url} alt={viewingAttachment.name} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop for sliding panel */}
      {activeResultId && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 transition-opacity" 
          onClick={() => setActiveResultId(null)}
        />
      )}

      {/* Complete Run Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[480px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 transition-colors border border-border">
             <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main">Complete run</h3>
                <button onClick={() => setIsCompleteModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={20}/></button>
             </div>
             <div className="px-6 py-6 text-[15px] text-text-muted">
                Do you want to complete this run?
             </div>
             <div className="px-6 py-4 bg-surface-hover border-t border-border/50 flex justify-end space-x-3 transition-colors">
                <button onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2 bg-background border border-border rounded-md text-sm font-bold text-text-main hover:bg-surface transition-colors shadow-sm">Cancel</button>
                <button onClick={handleCompleteRun} className="px-4 py-2 bg-primary rounded-md text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm">Complete</button>
             </div>
          </div>
        </div>
      )}

      {/* Share Report Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[560px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 transition-colors border border-border">
             <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main">Share report</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={20}/></button>
             </div>
             <div className="px-6 py-6 space-y-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isPublicLinkOn} onChange={togglePublicLink} disabled={isTogglingLink} />
                    <div className={`block w-11 h-6 rounded-full transition-colors ${isPublicLinkOn ? 'bg-primary' : 'bg-surface-hover border border-border'} ${isTogglingLink ? 'opacity-50' : ''}`}></div>
                    <div className={`absolute left-[2px] top-[2px] bg-surface w-5 h-5 rounded-full transition-transform transform ${isPublicLinkOn ? 'translate-x-5' : ''} shadow-sm`}></div>
                  </div>
                  <div className="ml-3 text-[15px] font-medium text-text-main group-hover:text-primary transition-colors">
                    {isPublicLinkOn ? 'Public link is turned on' : 'Public link is turned off'}
                  </div>
                </label>
                
                {isPublicLinkOn ? (
                  <div className="relative">
                    <input type="text" readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/report/${runId}` : ''} className="w-full border border-border rounded-md py-2.5 pl-3 pr-20 text-[15px] text-text-main bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" />
                    <button onClick={handleCopyPublicLink} className="absolute right-2 top-2 text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded hover:bg-primary/20 transition-colors">Copy</button>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">
                    Turn on the public link to allow anyone with the link to view the real-time execution report.
                  </div>
                )}
             </div>
             <div className="px-6 py-4 border-t border-border/50 flex justify-end bg-surface">
                <button onClick={() => setIsShareModalOpen(false)} className="px-5 py-2 bg-primary rounded-md text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm">Done</button>
             </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[480px] overflow-visible flex flex-col animate-in zoom-in-95 duration-200 transition-colors border border-border">
             <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main">Export test run</h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={20}/></button>
             </div>
             <div className="px-6 py-6 pb-24">
                <div className="relative border border-primary/50 rounded-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                   <div className="flex items-center px-3 py-2 border-b border-border/50 bg-background">
                      <input type="text" placeholder="Type to search" className="w-full text-sm outline-none text-text-main bg-transparent placeholder:text-text-muted" />
                   </div>
                   <div className="py-1 bg-surface">
                      <div 
                         className="px-3 py-2 text-sm text-text-main hover:bg-surface-hover cursor-pointer transition-colors flex items-center justify-between"
                         onClick={exportToCSV}
                      >
                         CSV
                      </div>
                      <div 
                         className="px-3 py-2 text-sm text-text-main hover:bg-surface-hover cursor-pointer transition-colors flex items-center justify-between"
                         onClick={isExportingPdf ? undefined : exportToPDF}
                      >
                         {isExportingPdf ? (
                           <span className="flex items-center text-text-muted"><Loader2 size={14} className="animate-spin mr-2"/> Generating PDF...</span>
                         ) : "PDF"}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[400px] rounded-lg shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200 transition-colors">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold text-text-main">Select assignee</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={20}/></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-text-main mb-2">Assign to</label>
              <select 
                className="w-full bg-background border border-border text-text-main rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
              >
                <option value="" disabled>Select user...</option>
                {projectMembers.map(user => (
                  <option key={user.id} value={user.id}>{user.name || user.email}</option>
                ))}
              </select>
            </div>
            <div className="px-6 py-4 bg-background border-t border-border/50 flex justify-end space-x-3">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover text-text-main transition-colors">Cancel</button>
              <button onClick={submitAssignee} className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-sm transition-all" disabled={!selectedAssigneeId}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
