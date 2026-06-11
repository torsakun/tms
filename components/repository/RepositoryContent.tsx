"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, PlayCircle, Settings, X, Edit3, Copy, Trash2, Cpu, FileText, Sparkles, CloudUpload, Loader2, GitMerge, ExternalLink, Ticket, Plus, AlertTriangle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { SuiteList } from "@/components/repository/SuiteList";
import { AiGeneratorModal } from "@/components/repository/AiGeneratorModal";
import { AiImpactModal } from "@/components/repository/AiImpactModal";
import { BulkJiraImpactModal } from "@/components/repository/BulkJiraImpactModal";
import { TestCaseAutomationPanel } from "@/components/repository/TestCaseAutomationPanel";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { CloneSuiteModal } from "@/components/repository/CloneSuiteModal";
import { ImportCasesModal } from "@/components/repository/ImportCasesModal";
import { useSuiteSelection } from "@/components/providers/SuiteSelectionProvider";

interface RepositoryContentProps {
  projectCode: string;
  suites: any[];
  cases: any[];
  activeSuiteId: string | null;
}

export function RepositoryContent({ projectCode, suites, cases, activeSuiteId }: RepositoryContentProps) {
  const router = useRouter();
  const { role } = useProjectRole();
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCloneCasesModalOpen, setIsCloneCasesModalOpen] = useState(false);
  const [isCloningCases, setIsCloningCases] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [isBulkJiraModalOpen, setIsBulkJiraModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastSyncPr, setLastSyncPr] = useState<{ url: string; number: number | null } | null>(null);
  const [customFieldsDef, setCustomFieldsDef] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { selectedCases, clearSelection } = useSuiteSelection();
  const hasSelection = selectedCases.size > 0;

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCases.size} selected test case(s)?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds: Array.from(selectedCases) })
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

  const executeBulkClone = async (payload: { destinationId: string | null }) => {
    setIsCloningCases(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk-clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caseIds: Array.from(selectedCases),
          destinationId: payload.destinationId
        })
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
    const caseIds = Array.from(selectedCases).join(',');
    router.push(`/projects/${projectCode}/runs/create?cases=${caseIds}`);
  };

  const handleBulkEdit = () => {
    toast("Bulk Edit is coming soon!", {
      description: "This feature is currently under development.",
      icon: "🚧"
    });
  };

  React.useEffect(() => {
    fetch("/api/workspace/fields")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomFieldsDef(data);
      })
      .catch(console.error);
  }, []);

  const handleSyncAll = async () => {
    if (!window.confirm("This will export all automated test cases to a single GitHub Pull Request. Continue?")) return;
    
    setIsSyncing(true);
    setLastSyncPr(null);
    try {
      const res = await fetch(`/api/projects/${projectCode}/github/sync-all`, { method: "POST" });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber: lastSyncPr.number })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");
      
      toast.success(`Merged successfully! ${data.message || ''}`);
      setLastSyncPr(null);
    } catch (err: any) {
      toast.error(`Error merging PR: ${err.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleExportQase = () => {
    window.open(`/api/projects/${projectCode}/export-qase`, '_blank');
  };

  const activeTestCase = cases.find(c => c.id === activeTestCaseId);

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-[#f0f2f8] transition-colors">
        {/* Toolbar */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0 transition-colors" style={{ borderColor: "#e8eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {hasSelection ? (
            <div className="flex items-center space-x-4 w-full">
              <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-lg px-1 py-1 h-9">
                <button onClick={handleBulkEdit} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors" title="Edit">
                  <Edit3 size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200"></div>
                <button onClick={handleBulkClone} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors" title="Clone">
                  <Copy size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200"></div>
                <button onClick={handleBulkRun} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-md transition-colors" title="Run">
                  <PlayCircle size={15} />
                </button>
                <div className="w-px h-4 bg-slate-200"></div>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-1.5 h-9 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-medium rounded-lg transition-colors shadow-sm">
                  <Sparkles size={14} className="mr-1.5 text-amber-500" />
                  Run advisor
                </button>
                <button className="flex items-center px-3 py-1.5 h-9 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-medium rounded-lg transition-colors shadow-sm">
                  <Cpu size={14} className="mr-1.5 text-indigo-500" />
                  Automate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search cases…"
                    className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                  />
                </div>

                <select className="px-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 text-slate-600 rounded-lg focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer w-36">
                  <option>By all fields</option>
                  <option>By title</option>
                </select>

                <button className="text-[13px] text-indigo-500 hover:text-indigo-700 font-semibold px-2">
                  + Filter
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {lastSyncPr && (
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg mr-2">
                    <a
                      href={lastSyncPr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-xs font-medium text-slate-700 hover:text-indigo-600 hover:underline transition-colors px-2 py-1"
                    >
                      <ExternalLink size={13} className="mr-1" />
                      View PR #{lastSyncPr.number}
                    </a>
                    {role !== 'VIEWER' && (
                      <button
                        onClick={handleQuickMerge}
                        disabled={isMerging}
                        className="flex items-center bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {isMerging ? <Loader2 size={12} className="mr-1 animate-spin" /> : <GitMerge size={12} className="mr-1" />}
                        Quick Merge
                      </button>
                    )}
                  </div>
                )}
                
                {role !== 'VIEWER' && (
                  <>
                    <button 
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                      title="Sync to GitHub"
                      className="flex items-center shrink-0 bg-gradient-to-r from-sky-400 to-blue-500 text-white px-2.5 lg:px-3 py-1.5 rounded-md text-[13px] font-bold shadow-md disabled:opacity-50 hover:brightness-110 transition-all"
                    >
                      {isSyncing ? <Loader2 size={14} className="animate-spin lg:mr-1.5" /> : <CloudUpload size={14} className="lg:mr-1.5" />}
                      <span className="hidden lg:inline">Sync</span>
                    </button>
                    <button 
                      onClick={() => setIsBulkJiraModalOpen(true)}
                      title="Story Impact Analysis"
                      className="flex items-center shrink-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 lg:px-3 py-1.5 rounded-md text-[13px] font-bold shadow-md hover:brightness-110 transition-all"
                    >
                      <Ticket size={14} className="lg:mr-1.5" />
                      <span className="hidden lg:inline">Impact</span>
                    </button>
                    <button 
                      onClick={() => setIsAiModalOpen(true)}
                      title="Generate AI Tests"
                      className="flex items-center shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 lg:px-3 py-1.5 rounded-md text-[13px] font-bold shadow-md hover:brightness-110 transition-all"
                    >
                      <Sparkles size={14} className="lg:mr-1.5" />
                      <span className="hidden lg:inline">AI Gen</span>
                    </button>
                    
                    <Link href={`/projects/${projectCode}/cases/create`} className="flex items-center shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover px-2.5 lg:px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm">
                      <Plus size={14} className="lg:mr-1.5" />
                      <span className="hidden lg:inline">Test Case</span>
                    </Link>

                    <div className="relative group shrink-0">
                      <button className="flex items-center shrink-0 bg-surface border border-border hover:bg-surface-hover text-text-main px-2.5 lg:px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm">
                        <Settings size={14} className="xl:mr-1.5" />
                        <span className="hidden xl:inline">Options</span>
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="p-1 flex flex-col space-y-0.5">
                          <button 
                            onClick={handleSyncAll}
                            className="lg:hidden flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-sm text-left"
                          >
                            <CloudUpload size={14} className="mr-2 text-text-muted" /> Sync to GitHub
                          </button>
                          <button 
                            onClick={handleExportQase}
                            className="flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-sm text-left"
                          >
                            <Download size={14} className="mr-2 text-text-muted" /> Export Qase
                          </button>
                          <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center w-full px-3 py-2 text-[13px] text-text-main hover:bg-surface-hover rounded-sm text-left"
                          >
                            <Upload size={14} className="mr-2 text-text-muted" /> Import Qase
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </header>


        {/* Hierarchical Content */}
        <div className="flex-1 overflow-y-auto bg-[#f0f2f8] relative transition-colors">
          <div className="p-6 pb-32">
            <SuiteList 
              suites={suites} 
              cases={cases} 
              activeSuiteId={activeSuiteId} 
              projectCode={projectCode} 
              onSelectCase={(tc: any) => setActiveTestCaseId(tc.id)}
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

      {/* Slide-over Detail Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[55vw] min-w-[600px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${activeTestCaseId ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ borderColor: "#e8eaf2" }}
      >
        {activeTestCase && (
          <>
            <header className="flex flex-col px-6 pt-5 pb-0 border-b bg-white shrink-0" style={{ borderColor: "#e8eaf2" }}>
              <div className="flex items-center justify-between mb-3">
                 <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">
                   {activeTestCase.code || `${projectCode}-${activeTestCase.id.substring(0,4)}`}
                 </span>
                 <div className="flex items-center gap-1">
                    <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><Copy size={15}/></button>
                    <button onClick={() => setActiveTestCaseId(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={18}/></button>
                 </div>
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight break-words mb-4 leading-snug">{activeTestCase.title}</h2>

              <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => router.push(`/projects/${projectCode}/cases/${activeTestCase.id}/edit`)} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-500 p-2 rounded-lg transition-colors shadow-sm" title="Edit case">
                    <Edit3 size={15} />
                 </button>
                 <button className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-500 p-2 rounded-lg transition-colors shadow-sm" title="Clone case">
                    <Copy size={15} />
                 </button>
                 <button className="bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-slate-500 p-2 rounded-lg transition-colors shadow-sm" title="Delete case">
                    <Trash2 size={15} />
                 </button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm">
                    <Sparkles size={13} className="mr-1.5 text-amber-500" /> Run advisor
                 </button>
                 <button className="text-white shadow-sm px-3 py-1.5 rounded-lg text-[13px] font-semibold flex items-center transition-all hover:-translate-y-0.5"
                   style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                    <Cpu size={13} className="mr-1.5" /> Automate
                 </button>
              </div>

              <div className="flex gap-6">
                <button className="pb-3 pt-1 border-b-2 border-indigo-500 text-indigo-600 font-bold text-sm">General</button>
                {["Properties","Runs","History","Defects","Comments"].map(tab => (
                  <button key={tab} className="pb-3 pt-1 border-b-2 border-transparent text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors">{tab}</button>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-[#f0f2f8] p-5 space-y-4">
              {activeTestCase.isOutdated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col space-y-3 shadow-sm mb-4">
                  <div className="flex items-start">
                    <AlertTriangle size={20} className="text-amber-500 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">Requirement Changed</h4>
                      <p className="text-xs text-amber-700 mt-1">The requirement linked to this test case has been updated. The steps may be outdated.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsImpactModalOpen(true)} className="self-start flex items-center bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors">
                    <Sparkles size={14} className="mr-1.5" /> Analyze Impact with AI
                  </button>
                </div>
              )}
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" style={{ borderLeft: "3px solid #6366f1" }}>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {activeTestCase.description || <span className="text-slate-400 italic">Not set</span>}
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" style={{ borderLeft: "3px solid #06b6d4" }}>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pre-conditions</h3>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {activeTestCase.preconditions ? (
                      <div dangerouslySetInnerHTML={{ __html: activeTestCase.preconditions }} />
                    ) : (
                      <span className="text-slate-400 italic">Not set</span>
                    )}
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" style={{ borderLeft: "3px solid #10b981" }}>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Post-conditions</h3>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {activeTestCase.postconditions ? (
                      <div dangerouslySetInnerHTML={{ __html: activeTestCase.postconditions }} />
                    ) : (
                      <span className="text-slate-400 italic">Not set</span>
                    )}
                  </div>
               </div>

               {activeTestCase.customFields && Object.keys(activeTestCase.customFields).length > 0 && (
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" style={{ borderLeft: "3px solid #a855f7" }}>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeTestCase.customFields).map(([fieldId, value]) => {
                        if (!value || (typeof value === 'boolean' && !value)) return null;
                        const fieldDef = customFieldsDef.find(f => f.id === fieldId);
                        const label = fieldDef ? fieldDef.name : fieldId;
                        return (
                          <div key={fieldId}>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                            <div className="text-sm text-slate-700 font-medium">
                              {typeof value === 'boolean' ? 'Yes' : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}

               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" style={{ borderLeft: "3px solid #f59e0b" }}>
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Steps</h3>
                     <button onClick={() => router.push(`/projects/${projectCode}/cases/${activeTestCase.id}/edit`)} className="text-indigo-500 hover:text-indigo-700 text-xs font-bold flex items-center transition-colors">
                        <Edit3 size={12} className="mr-1" /> Edit
                     </button>
                  </div>

                  {activeTestCase.steps && activeTestCase.steps.length > 0 ? (
                    <div className="space-y-4">
                      {activeTestCase.steps.map((step: any, idx: number) => (
                        <div key={step.id || idx} className="flex">
                           <div className="w-8 shrink-0 flex justify-center mt-0.5">
                             <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-sm"
                               style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                               {idx + 1}
                             </div>
                           </div>
                           <div className="flex-1 ml-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                             {step.action}
                             {step.expectedResult && (
                               <div className="mt-2 text-[13px] bg-emerald-50/60 border-l-2 border-emerald-400 rounded-r-lg pl-3 pr-3 py-2 text-slate-600">
                                 <span className="font-bold text-emerald-700">Expected: </span>
                                 {step.expectedResult}
                               </div>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">Not set</div>
                  )}
               </div>

               <TestCaseAutomationPanel 
                 testCase={activeTestCase} 
                 projectCode={projectCode} 
                 onUpdate={() => window.location.reload()} 
               />
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
    </>
  );
}
