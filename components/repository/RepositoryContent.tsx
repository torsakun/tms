"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, PlayCircle, Settings, X, Edit3, Copy, Trash2, Cpu, FileText, Sparkles, CloudUpload, Loader2, GitMerge, ExternalLink, Ticket, Plus } from "lucide-react";
import { SuiteList } from "@/components/repository/SuiteList";
import { AiGeneratorModal } from "@/components/repository/AiGeneratorModal";
import { TestCaseAutomationPanel } from "@/components/repository/TestCaseAutomationPanel";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { CloneCasesModal } from "@/components/repository/CloneCasesModal";
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
  const [lastSyncPr, setLastSyncPr] = useState<{ url: string; number: number | null } | null>(null);
  const [customFieldsDef, setCustomFieldsDef] = useState<any[]>([]);

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
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete test cases");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting test cases");
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
        const data = await res.json();
        setIsCloneCasesModalOpen(false);
        clearSelection();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to clone test cases");
      }
    } catch (err) {
      console.error(err);
      alert("Error cloning test cases");
    } finally {
      setIsCloningCases(false);
    }
  };

  const handleBulkRun = () => {
    const caseIds = Array.from(selectedCases).join(',');
    router.push(`/projects/${projectCode}/runs/create?cases=${caseIds}`);
  };

  const handleBulkEdit = () => {
    alert("Bulk Edit is coming soon!");
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
      alert(`Success! Created PR for ${data.count} test cases.`);
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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
      
      alert(`Merged successfully! ${data.message || ''}`);
      setLastSyncPr(null);
    } catch (err: any) {
      alert(`Error merging PR: ${err.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const activeTestCase = cases.find(c => c.id === activeTestCaseId);

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-background transition-colors">
        {/* Toolbar (Qase-style Filter Bar or Bulk Action Toolbar) */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-white shrink-0 transition-colors">
          {hasSelection ? (
            <div className="flex items-center space-x-4 w-full">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded px-1 py-1 h-9">
                <button onClick={handleBulkEdit} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors" title="Edit">
                  <Edit3 size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={handleBulkClone} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors" title="Clone">
                  <Copy size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={handleBulkRun} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors" title="Run">
                  <PlayCircle size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  onClick={handleBulkDelete}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-1.5 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[13px] font-medium rounded transition-colors shadow-sm">
                  <Sparkles size={14} className="mr-1.5 text-blue-500" />
                  Run advisor
                </button>
                <button className="flex items-center px-3 py-1.5 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[13px] font-medium rounded transition-colors shadow-sm">
                  <Cpu size={14} className="mr-1.5 text-indigo-500" />
                  Automate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="relative w-48">
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full px-3 py-1.5 text-[13px] bg-white border border-slate-300 text-slate-700 rounded focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="relative w-36">
                  <select className="w-full px-3 py-1.5 text-[13px] bg-white border border-slate-300 text-slate-700 rounded focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                    <option>By all fields</option>
                    <option>By title</option>
                  </select>
                </div>
                
                <button className="text-[13px] text-blue-600 font-medium hover:underline">
                  Add filter
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {lastSyncPr && (
                  <div className="flex items-center space-x-2 bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded mr-2">
                    <a 
                      href={lastSyncPr.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View PR #{lastSyncPr.number}
                    </a>
                    {role !== 'VIEWER' && (
                      <button
                        onClick={handleQuickMerge}
                        disabled={isMerging}
                        className="flex items-center bg-indigo-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
                      className="flex items-center bg-slate-800 text-white px-3 py-1.5 rounded text-[13px] font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {isSyncing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CloudUpload size={14} className="mr-1.5" />}
                      Sync to GitHub
                    </button>
                    <button 
                      onClick={() => setIsAiModalOpen(true)}
                      className="flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[13px] font-medium rounded border border-amber-200 transition-colors shadow-sm"
                    >
                      <Sparkles size={14} className="mr-1.5" />
                      Generate Tests
                    </button>
                    
                    <Link href={`/projects/${projectCode}/cases/create`} className="flex items-center px-3 py-1.5 bg-[#4834d4] hover:bg-blue-700 text-white text-[13px] font-medium rounded shadow-sm transition-colors">
                      <Plus size={14} className="mr-1.5" />
                      Test case
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </header>


        {/* Hierarchical Content */}
        <div className="flex-1 overflow-y-auto bg-background relative transition-colors">
          <div className="p-8 pb-32">
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

      <CloneCasesModal
        isOpen={isCloneCasesModalOpen}
        onClose={() => setIsCloneCasesModalOpen(false)}
        caseCount={selectedCases.size}
        allSuites={suites}
        projectCode={projectCode}
        onClone={executeBulkClone}
        isCloning={isCloningCases}
      />

      {/* Slide-over Detail Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[55vw] min-w-[600px] bg-surface shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${activeTestCaseId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {activeTestCase && (
          <>
            <header className="flex flex-col px-6 py-4 border-b border-border/50 bg-surface shrink-0 transition-colors">
              <div className="flex items-center justify-between mb-2">
                 <div className="text-xs text-text-muted font-mono">
                   {activeTestCase.code || `${projectCode}-${activeTestCase.id.substring(0,4)}`}
                 </div>
                 <div className="flex items-center space-x-2">
                    <button className="text-text-muted hover:text-text-main p-1.5"><Copy size={16}/></button>
                    <button onClick={() => setActiveTestCaseId(null)} className="text-text-muted hover:text-red-500 p-1.5"><X size={20}/></button>
                 </div>
              </div>
              <h2 className="text-xl font-bold text-text-main break-words mb-4">{activeTestCase.title}</h2>
              
              <div className="flex items-center space-x-2 mb-4">
                 <button onClick={() => router.push(`/projects/${projectCode}/cases/${activeTestCase.id}/edit`)} className="bg-background border border-border hover:bg-surface-hover text-text-main p-2 rounded transition-colors" title="Edit case">
                    <Edit3 size={16} />
                 </button>
                 <button className="bg-background border border-border hover:bg-surface-hover text-text-main p-2 rounded transition-colors" title="Clone case">
                    <Copy size={16} />
                 </button>
                 <button className="bg-background border border-border hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 text-text-main p-2 rounded transition-colors" title="Delete case">
                    <Trash2 size={16} />
                 </button>
                 <div className="w-px h-6 bg-border mx-1"></div>
                 <button className="bg-background border border-border hover:bg-surface-hover text-text-main px-3 py-1.5 rounded text-sm font-semibold flex items-center transition-colors">
                    <Settings size={14} className="mr-2" /> Run advisor
                 </button>
                 <button className="bg-primary hover:bg-blue-700 text-white shadow-[0_0_10px_rgba(93,135,255,0.4)] px-3 py-1.5 rounded text-sm font-semibold flex items-center transition-colors">
                    <Cpu size={14} className="mr-2" /> Automate
                 </button>
              </div>

              <div className="flex space-x-6">
                <button className="pb-3 pt-2 border-b-2 border-primary text-primary font-bold text-sm">General</button>
                <button className="pb-3 pt-2 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Properties</button>
                <button className="pb-3 pt-2 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Runs</button>
                <button className="pb-3 pt-2 text-text-muted hover:text-text-main font-medium text-sm transition-colors">History</button>
                <button className="pb-3 pt-2 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Defects</button>
                <button className="pb-3 pt-2 text-text-muted hover:text-text-main font-medium text-sm transition-colors">Comments</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-background p-6 space-y-8 transition-colors">
               <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                  <h3 className="text-sm font-bold text-text-main mb-2">Description</h3>
                  <div className="text-[15px] text-text-muted">
                    {activeTestCase.description || "Not set"}
                  </div>
               </div>

               <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                  <h3 className="text-sm font-bold text-text-main mb-2">Pre-conditions</h3>
                  <div className="text-[15px] text-text-muted">
                    {activeTestCase.preconditions ? (
                      <div dangerouslySetInnerHTML={{ __html: activeTestCase.preconditions }} />
                    ) : (
                      "Not set"
                    )}
                  </div>
               </div>

               <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                  <h3 className="text-sm font-bold text-text-main mb-2">Post-conditions</h3>
                  <div className="text-[15px] text-text-muted">
                    {activeTestCase.postconditions ? (
                      <div dangerouslySetInnerHTML={{ __html: activeTestCase.postconditions }} />
                    ) : (
                      "Not set"
                    )}
                  </div>
               </div>

               {activeTestCase.customFields && Object.keys(activeTestCase.customFields).length > 0 && (
                 <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                    <h3 className="text-sm font-bold text-text-main mb-4">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeTestCase.customFields).map(([fieldId, value]) => {
                        if (!value || (typeof value === 'boolean' && !value)) return null;
                        const fieldDef = customFieldsDef.find(f => f.id === fieldId);
                        const label = fieldDef ? fieldDef.name : fieldId;
                        return (
                          <div key={fieldId}>
                            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</div>
                            <div className="text-[14px] text-text-main font-medium">
                              {typeof value === 'boolean' ? 'Yes' : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}

               <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-text-main">Steps</h3>
                     <button onClick={() => router.push(`/projects/${projectCode}/cases/${activeTestCase.id}/edit`)} className="text-primary hover:underline text-sm font-semibold flex items-center transition-colors">
                        <Edit3 size={14} className="mr-1" /> Edit
                     </button>
                  </div>
                  
                  {activeTestCase.steps && activeTestCase.steps.length > 0 ? (
                    <div className="space-y-4">
                      {activeTestCase.steps.map((step: any, idx: number) => (
                        <div key={step.id || idx} className="flex">
                           <div className="w-8 shrink-0 flex justify-center mt-0.5">
                             <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-text-muted font-bold text-xs border border-border">
                               {idx + 1}
                             </div>
                           </div>
                           <div className="flex-1 ml-2 text-[15px] text-text-main whitespace-pre-wrap">
                             {step.action}
                             {step.expectedResult && (
                               <div className="mt-2 text-text-muted text-sm border-l-2 border-border pl-3">
                                 <span className="font-semibold text-text-main">Expected: </span>
                                 {step.expectedResult}
                               </div>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[15px] text-text-muted">Not set</div>
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

      {/* Backdrop for sliding panel */}
      {activeTestCaseId && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 transition-opacity" 
          onClick={() => setActiveTestCaseId(null)}
        />
      )}
    </>
  );
}
