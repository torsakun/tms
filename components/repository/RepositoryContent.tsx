"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, PlayCircle, Settings, X, Edit3, Copy, Trash2, Cpu, FileText, Sparkles, CloudUpload, Loader2, GitMerge, ExternalLink, Ticket } from "lucide-react";
import { SuiteList } from "@/components/repository/SuiteList";
import { AiGeneratorModal } from "@/components/repository/AiGeneratorModal";
import { TestCaseAutomationPanel } from "@/components/repository/TestCaseAutomationPanel";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [lastSyncPr, setLastSyncPr] = useState<{ url: string; number: number | null } | null>(null);
  const [customFieldsDef, setCustomFieldsDef] = useState<any[]>([]);

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
        {/* Toolbar (Qase-style Filter Bar) */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-white shrink-0 transition-colors">
          <div className="flex items-center space-x-3 flex-1">
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
                <option>By description</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>

            <button className="text-[13px] text-blue-600 font-medium hover:underline px-2">
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
                <Link href={`/projects/${projectCode}/runs`} className="flex items-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded text-[13px] font-medium hover:bg-emerald-500/20 transition-colors">
                  <PlayCircle size={14} className="mr-1.5" />
                  Start Run
                </Link>
                <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded text-[13px] font-medium hover:bg-amber-100 transition-colors"
                >
                  <Sparkles size={14} className="mr-1.5" />
                  Generate with AI
                </button>
                <Link href={`/projects/${projectCode}/cases/create${activeSuiteId ? `?suite=${activeSuiteId}` : ''}`} className="bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-medium hover:bg-blue-700 transition-colors">
                  Create Case
                </Link>
              </>
            )}
            
            {role === 'ADMIN' && (
              <Link href={`/projects/${projectCode}/settings/members`} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Project Settings">
                <Settings size={18} />
              </Link>
            )}
          </div>
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
