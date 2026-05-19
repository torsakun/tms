"use client";

import React, { useState } from "react";
import { Plus, Edit2, Copy, Trash2, ChevronRight, ChevronDown, GripVertical, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { useSuiteExpansion } from "@/components/providers/SuiteExpansionProvider";

interface SuiteNodeProps {
  suite: any;
  depth: number;
  childrenMap: Map<string, any[]>;
  casesBySuiteId: Map<string, any[]>;
  projectCode: string;
  onSelectCase?: (testCase: any) => void;
  isUnassigned?: boolean;
}

export function SuiteNode({ suite, depth, childrenMap, casesBySuiteId, projectCode, onSelectCase, isUnassigned }: SuiteNodeProps) {
  const [showQuickTest, setShowQuickTest] = useState(false);
  const [quickTestTitle, setQuickTestTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { role } = useProjectRole();
  const { isExpanded, toggleSuite } = useSuiteExpansion();
  const isOpen = isExpanded(suite.id);

  const children = childrenMap.get(suite.id) || [];
  const cases = casesBySuiteId.get(suite.id) || [];

  // Use white background with subtle border, like Qase.
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

  return (
    <div id={`suite-${suite.id}`} className={cn("flex flex-col", depth > 0 && "ml-4 mt-2")}>
      <div 
        className={cn("group flex items-center justify-between px-4 py-2 transition-colors", headerBgClass)}
      >
        <div 
          className="flex items-center cursor-pointer flex-1"
          onClick={() => toggleSuite(suite.id)}
        >
          <span className={titleClass}>
            {suite.title}
          </span>
          
          {/* Action Icons right next to title */}
          {role !== 'VIEWER' && !isUnassigned && (
            <div className="flex items-center space-x-0.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQuickTest(true); }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Create quick test"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                <Edit2 size={14} />
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                <Copy size={14} />
              </button>
              <button className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
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
              {cases.map((tc: any) => (
                <div 
                  key={tc.id} 
                  className="group flex items-center px-4 py-1.5 border-b border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSelectCase) {
                      onSelectCase(tc);
                    } else {
                      router.push(`/projects/${projectCode}/cases/${tc.id}/edit`);
                    }
                  }}
                >
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
              ))}
              
              {/* Create Quick Test button below cases if there are cases */}
              {role !== 'VIEWER' && !showQuickTest && (
                <div className="px-4 py-1.5 mt-1">
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
