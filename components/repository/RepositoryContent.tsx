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
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-background transition-colors">
        {/* Toolbar (Qase-style Filter Bar or Bulk Action Toolbar) */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background shrink-0 transition-colors">
          {hasSelection ? (
            <div className="flex items-center space-x-4 w-full">
              <div className="flex items-center space-x-2 bg-surface-hover border border-border rounded px-1 py-1 h-9">
                <button onClick={handleBulkEdit} className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded transition-colors" title="Edit">
                  <Edit3 size={16} />
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button onClick={handleBulkClone} className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded transition-colors" title="Clone">
                  <Copy size={16} />
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button onClick={handleBulkRun} className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded transition-colors" title="Run">
                  <PlayCircle size={16} />
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button 
                  onClick={handleBulkDelete}
                  className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" 
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-1.5 h-9 bg-surface hover:bg-surface-hover border border-border text-text-main text-[13px] font-medium rounded-md transition-colors shadow-sm">
                  <Sparkles size={14} className="mr-1.5" />
                  Run advisor
                </button>
                <button className="flex items-center px-3 py-1.5 h-9 bg-surface hover:bg-surface-hover border border-border text-text-main text-[13px] font-medium rounded-md transition-colors shadow-sm">
                  <Cpu size={14} className="mr-1.5" />
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
                    className="w-full px-3 py-1.5 text-[13px] bg-surface border border-border text-text-main rounded-md focus:outline-none focus:border-text-muted transition-colors"
                  />
                </div>
                
                <div className="relative w-36">
                  <select className="w-full px-3 py-1.5 text-[13px] bg-surface border border-border text-text-main rounded-md focus:outline-none focus:border-text-muted appearance-none cursor-pointer">
                    <option>By all fields</option>
                    <option>By title</option>
                  </select>
                </div>
                
                <button className="text-[13px] text-text-muted hover:text-text-main font-medium">
                  Add filter
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {lastSyncPr && (
                  <div className="flex items-center space-x-2 bg-surface-hover border border-border px-2 py-1 rounded-md mr-2">
                    <a 
                      href={lastSyncPr.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center text-xs font-medium text-text-main hover:underline transition-colors px-2 py-1"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View PR #{lastSyncPr.number}
                    </a>
                    {role !== 'VIEWER' && (
                      <button
                        onClick={handleQuickMerge}
                        disabled={isMerging}
                        className="flex items-center bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
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
        className={`fixed top-0 right-0 h-full w-[55vw] min-w-[600px] bg-surface shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${activeTestCaseId ? 'translate-x-0' : 'translate-x-full'}`}
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
                 <button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm px-3 py-1.5 rounded text-sm font-semibold flex items-center transition-colors">
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
