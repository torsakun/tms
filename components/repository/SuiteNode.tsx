"use client";

import React, { useState } from "react";
import { Plus, Edit2, Copy, Trash2, CheckSquare, Square, Sparkles, User, Check } from "lucide-react";
import { toast } from "sonner";
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

  const headerBgClass = "bg-surface-hover border border-border rounded-md";
  
  const titleClass = depth === 0 
    ? "font-bold text-[15px] text-text-main" 
    : "font-semibold text-[14px] text-text-main";
                      
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
        toast.success("Suite updated successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update suite");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating suite");
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
        toast.success("Suite cloned successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to clone suite");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cloning suite");
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
        toast.success("Suite deleted successfully");
      } else {
        const data = await res.json();
        toast.error("Failed to delete suite: " + (data.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting suite");
    } finally {
      setIsDeletingSuite(false);
    }
  };

  const allCasesInSuite = cases.map(c => c.id);
  const isAllSelected = areAllCasesSelected(allCasesInSuite);

  return (
    <div id={`suite-${suite.id}`} className={cn("flex flex-col", depth > 0 && "ml-4 mt-2")}>
      <div 
        className={cn("group px-4 py-3 transition-colors mb-2", headerBgClass)}
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
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-primary-hover"
              >
                {isSavingSuite ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditingSuite(false)} 
                className="text-text-muted hover:bg-surface-hover px-3 py-1 rounded text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1 min-w-0">
              {/* Suite Checkbox (optional/hidden by default in Qase, but we keep it small) */}
              {!isUnassigned && cases.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSuiteCases(allCasesInSuite); }}
                  className="mt-0.5 mr-3 text-slate-300 hover:text-primary transition-colors focus:outline-none"
                >
                  {isAllSelected ? (
                    <div className="w-3.5 h-3.5 rounded bg-primary flex items-center justify-center text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded border border-text-muted hover:border-blue-400" />
                  )}
                </button>
              )}
              
              <div 
                className="flex items-start cursor-pointer flex-1 min-w-0"
                onClick={() => toggleSuite(suite.id)}
              >
                <div className="flex flex-col truncate">
                  <div className="flex items-center">
                    <span className={cn("truncate", titleClass)}>
                      {suite.title}
                    </span>
                    {/* Action Icons right next to title */}
                    {role !== 'VIEWER' && !isUnassigned && !hasSelection && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-3 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowQuickTest(true); }}
                          className="p-1 text-primary hover:bg-blue-50 rounded transition-colors"
                          title="Create quick test"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditingSuite(true); }}
                          className="p-1 text-text-muted hover:text-text-muted hover:bg-slate-200/50 rounded transition-colors"
                          title="Edit suite"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={handleCloneSuiteClick}
                          className="p-1 text-text-muted hover:text-text-muted hover:bg-slate-200/50 rounded transition-colors"
                          title="Clone suite"
                        >
                          <Copy size={13} />
                        </button>
                        <button 
                          onClick={handleDeleteSuiteClick}
                          className="p-1 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete suite"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  {suite.description && (
                    <span className="text-[13px] text-text-muted mt-1 truncate">
                      {suite.description}
                    </span>
                  )}
                </div>
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
                  className={cn("group flex items-center px-4 py-1.5 border-b border-transparent hover:border-border hover:bg-surface-hover transition-colors cursor-pointer", isSelected && "bg-blue-50/50 hover:bg-blue-50")}
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
                      className="mr-3 text-slate-300 hover:text-primary transition-colors focus:outline-none shrink-0"
                    >
                      {isSelected ? (
                        <div className="w-3.5 h-3.5 rounded bg-primary flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-text-muted hover:border-blue-400" />
                      )}
                    </button>
                  )}

                  <div className="flex items-center space-x-3 shrink-0 mr-3">
                    {/* Priority Icon */}
                    <div className="w-3.5 flex justify-center">
                      {(tc.priority === 'High' || tc.priority === 'Critical') ? (
                        <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                      ) : (tc.priority === 'Low' || tc.priority === 'Trivial') ? (
                        <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                      ) : (
                        <svg className="w-2.5 h-2.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><circle cx="12" cy="12" r="10"></circle></svg>
                      )}
                    </div>
                    {/* Type Badge (M or AI) */}
                    <div className="w-4 flex justify-center shrink-0 text-text-muted">
                      {tc.tags?.some((t: any) => t.name === "AI-Generated") ? (
                        <span title="AI Generated"><Sparkles size={12} className="text-amber-500" /></span>
                      ) : (
                        <span title="Manual"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-16 shrink-0 text-[13px] text-text-muted font-medium">
                    {tc.code || `${projectCode}-${tc.id.substring(0,2)}`}
                  </div>
                  
                  <div className="flex-1 flex items-center text-sm font-normal text-text-main min-w-0">
                    <span className="truncate">{tc.title}</span>
                    {tc.isOutdated && (
                      <span className="ml-2 flex shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700" title="Requirement Changed">
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        OUTDATED
                      </span>
                    )}
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
                                toast.success("Test case deleted successfully");
                              } else {
                                const data = await res.json();
                                toast.error("Failed to delete test case: " + (data.error || res.statusText));
                              }
                            } catch (err: any) {
                              console.error(err);
                              toast.error("Error: " + err.message);
                            }
                          }
                        }}
                        className="p-1 text-text-muted hover:text-red-500 rounded transition-colors"
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
                    className="text-[13px] font-medium text-text-muted hover:text-primary flex items-center transition-colors"
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
