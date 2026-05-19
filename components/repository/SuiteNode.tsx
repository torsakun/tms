"use client";

import React, { useState } from "react";
import { Plus, Edit2, Copy, Trash2, CheckSquare, Square, Sparkles, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { useSuiteExpansion } from "@/components/providers/SuiteExpansionProvider";
import { useSuiteSelection } from "@/components/providers/SuiteSelectionProvider";
import { CloneSuiteModal } from "./CloneSuiteModal";
import { DeleteSuiteModal } from "./DeleteSuiteModal";

interface SuiteNodeProps {
  suite: any;
  depth: number;
  childrenMap: Map<string, any[]>;
  casesBySuiteId: Map<string, any[]>;
  projectCode: string;
  onSelectCase?: (testCase: any) => void;
  isUnassigned?: boolean;
  allSuites: any[];
}

export function SuiteNode({ suite, depth, childrenMap, casesBySuiteId, projectCode, onSelectCase, isUnassigned, allSuites }: SuiteNodeProps) {
  const [showQuickTest, setShowQuickTest] = useState(false);
  const [quickTestTitle, setQuickTestTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit State
  const [isEditingSuite, setIsEditingSuite] = useState(false);
  const [editTitle, setEditTitle] = useState(suite.title);
  const [editDescription, setEditDescription] = useState(suite.description || "");
  const [isSavingSuite, setIsSavingSuite] = useState(false);
  
  // Clone Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingSuite, setIsDeletingSuite] = useState(false);

  const router = useRouter();
  const { role } = useProjectRole();
  const { isExpanded, toggleSuite } = useSuiteExpansion();
  const isOpen = isExpanded(suite.id);
  
  // Selection Context
  const { toggleCase, toggleSuiteCases, isCaseSelected, areAllCasesSelected, selectedCases } = useSuiteSelection();
  const hasSelection = selectedCases.size > 0;

  const children = childrenMap.get(suite.id) || [];
  const cases = casesBySuiteId.get(suite.id) || [];

  const headerBgClass = "bg-white border-b border-border/50";
  
  const titleClass = depth === 0 
    ? "font-bold text-[15px] text-slate-800" 
    : "font-semibold text-[14px] text-slate-800";
                      
  const handleCreateQuickTest = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTestTitle.trim() && !isCreating) {
      setIsCreating(true);
      try {
        const res = await fetch(`/api/projects/${projectCode}/cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quickTestTitle.trim(),
            suiteId: suite.id === 'unassigned' ? undefined : suite.id,
            priority: "Medium",
            status: "Active"
          })
        });

        if (res.ok) {
          setQuickTestTitle("");
          setShowQuickTest(false);
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to create quick test", err);
      } finally {
        setIsCreating(false);
      }
    }
    if (e.key === 'Escape') {
      setShowQuickTest(false);
      setQuickTestTitle("");
    }
  };

  const handleUpdateSuite = async () => {
    if (!editTitle.trim()) return;
    setIsSavingSuite(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/suites/${suite.id}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });
      if (res.ok) {
        setIsEditingSuite(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update suite");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating suite");
    } finally {
      setIsSavingSuite(false);
    }
  };

  const handleCloneSuiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCloneModalOpen(true);
  };

  const executeCloneSuite = async (payload: { destinationId: string | null; strategy: "cases_and_suites" | "only_suites"; withChildren: boolean }) => {
    setIsCloning(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/suites/${suite.id}/clone`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCloneModalOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to clone suite");
      }
    } catch (err) {
      console.error(err);
      alert("Error cloning suite");
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteSuiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const executeDeleteSuite = async (retainCases: boolean) => {
    setIsDeletingSuite(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/suites/${suite.id}`, { 
        method: 'DELETE',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retainCases })
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert("Failed to delete suite: " + (data.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting suite");
    } finally {
      setIsDeletingSuite(false);
    }
  };

  const allCasesInSuite = cases.map(c => c.id);
  const isAllSelected = areAllCasesSelected(allCasesInSuite);

  return (
    <div id={`suite-${suite.id}`} className={cn("flex flex-col", depth > 0 && "ml-4 mt-2")}>
      <div 
        className={cn("group px-4 py-2 transition-colors", headerBgClass)}
      >
        {isEditingSuite ? (
          <div className="flex flex-col space-y-2 py-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="Suite Name"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-primary/20 min-h-[60px]"
              placeholder="Description (Optional)"
            />
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleUpdateSuite} 
                disabled={isSavingSuite}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
              >
                {isSavingSuite ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditingSuite(false)} 
                className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {/* Suite Checkbox */}
              {!isUnassigned && cases.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSuiteCases(allCasesInSuite); }}
                  className="mr-3 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                >
                  {isAllSelected ? (
                    <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded border border-slate-300 hover:border-blue-400" />
                  )}
                </button>
              )}
              
              <div 
                className="flex items-center cursor-pointer flex-1 min-w-0"
                onClick={() => toggleSuite(suite.id)}
              >
                <div className="flex flex-col truncate">
                  <span className={cn("truncate", titleClass)}>
                    {suite.title}
                  </span>
                  {suite.description && (
                    <span className="text-[13px] text-slate-500 mt-0.5 truncate">
                      {suite.description}
                    </span>
                  )}
                </div>
                
                {/* Action Icons right next to title */}
                {role !== 'VIEWER' && !isUnassigned && !hasSelection && (
                  <div className="flex items-center space-x-0.5 ml-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowQuickTest(true); }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Create quick test"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditingSuite(true); }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      title="Edit suite"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={handleCloneSuiteClick}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      title="Clone suite"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={handleDeleteSuiteClick}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete suite"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suite Content (Cases and Child Suites) with Accordion Transition */}
      <div 
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className={cn("overflow-hidden flex flex-col", depth === 0 && "pl-2")}>
          
          {/* Quick Test Input */}
          {role !== 'VIEWER' && (showQuickTest || cases.length === 0 && children.length === 0) && (
            <div className="px-6 py-2 mt-1">
              {showQuickTest ? (
                <input
                  autoFocus
                  type="text"
                  value={quickTestTitle}
                  onChange={(e) => setQuickTestTitle(e.target.value)}
                  onKeyDown={handleCreateQuickTest}
                  onBlur={() => { if (!quickTestTitle) setShowQuickTest(false); }}
                  placeholder="Type test case title and press Enter..."
                  className="w-full max-w-lg px-3 py-1.5 text-sm border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-text-main transition-colors shadow-sm"
                  disabled={isCreating}
                />
              ) : (
                <button 
                  onClick={() => setShowQuickTest(true)}
                  className="text-xs font-medium text-text-muted hover:text-primary flex items-center transition-colors"
                >
                  <Plus size={14} className="mr-1" /> Create quick test
                </button>
              )}
            </div>
          )}

          {/* Test Cases */}
          {cases.length > 0 && (
            <div className="flex flex-col mt-2">
              {cases.map((tc: any) => {
                const isSelected = isCaseSelected(tc.id);
                return (
                <div 
                  key={tc.id} 
                  className={cn("group flex items-center px-4 py-1.5 border-b border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer", isSelected && "bg-blue-50/50 hover:bg-blue-50")}
                  onClick={() => {
                    if (onSelectCase) {
                      onSelectCase(tc);
                    } else {
                      router.push(`/projects/${projectCode}/cases/${tc.id}/edit`);
                    }
                  }}
                >
                  {/* Case Checkbox */}
                  {!isUnassigned && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCase(tc.id); }}
                      className="mr-3 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none shrink-0"
                    >
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 hover:border-blue-400" />
                      )}
                    </button>
                  )}

                  <div className="flex items-center space-x-3 shrink-0 mr-3">
                    {/* Priority Icon */}
                    <div className="w-4 flex justify-center">
                      {(tc.priority === 'High' || tc.priority === 'Critical') ? (
                        <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                      ) : (tc.priority === 'Low' || tc.priority === 'Trivial') ? (
                        <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                      ) : (
                        <svg className="w-2 h-2 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="10"></circle></svg>
                      )}
                    </div>
                    {/* Type Badge (M or AI) */}
                    <div className="w-5 flex justify-center shrink-0">
                      {tc.tags?.some((t: any) => t.name === "AI-Generated") ? (
                        <span title="AI Generated" className="flex items-center justify-center w-[18px] h-[18px] rounded bg-amber-100/80 text-amber-600 text-[9px] font-bold border border-amber-200">
                          AI
                        </span>
                      ) : (
                        <span title="Manually Created" className="flex items-center justify-center w-[18px] h-[18px] rounded bg-blue-50 text-blue-500 text-[10px] font-bold border border-blue-100">
                          M
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-16 shrink-0 text-[13px] text-slate-400 font-medium">
                    {tc.code || `${projectCode}-${tc.id.substring(0,2)}`}
                  </div>
                  
                  <div className="flex-1 flex items-center text-sm font-normal text-slate-700 min-w-0">
                    <span className="truncate">{tc.title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {role !== 'VIEWER' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this test case?")) {
                            try {
                              const res = await fetch(`/api/projects/${projectCode}/cases/${tc.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                router.refresh();
                              } else {
                                const data = await res.json();
                                alert("Failed to delete test case: " + (data.error || res.statusText));
                              }
                            } catch (err: any) {
                              console.error(err);
                              alert("Error: " + err.message);
                            }
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Delete test case"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )})}
              
              {/* Create Quick Test button below cases if there are cases */}
              {role !== 'VIEWER' && !showQuickTest && (
                <div className="px-4 py-1.5 mt-1 ml-6">
                  <button 
                    onClick={() => setShowQuickTest(true)}
                    className="text-[13px] font-medium text-slate-400 hover:text-blue-600 flex items-center transition-colors"
                  >
                    + Create quick test
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Child Suites */}
          {children.length > 0 && (
            <div className="mt-1">
              {children.map((childSuite: any) => (
                <SuiteNode 
                  key={childSuite.id} 
                  suite={childSuite} 
                  depth={depth + 1} 
                  childrenMap={childrenMap} 
                  casesBySuiteId={casesBySuiteId} 
                  projectCode={projectCode} 
                  onSelectCase={onSelectCase}
                  allSuites={allSuites}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CloneSuiteModal 
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        suite={suite}
        allSuites={allSuites}
        projectCode={projectCode}
        onClone={executeCloneSuite}
        isCloning={isCloning}
      />

      <DeleteSuiteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        suite={suite}
        casesBySuiteId={casesBySuiteId}
        childrenMap={childrenMap}
        onDelete={executeDeleteSuite}
        isDeleting={isDeletingSuite}
      />
    </div>
  );
}
