"use client";

import React, { useState } from "react";
import { Plus, Edit2, Copy, Trash2, ChevronRight, ChevronDown, GripVertical, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";

interface SuiteNodeProps {
  suite: any;
  depth: number;
  childrenMap: Map<string, any[]>;
  casesBySuiteId: Map<string, any[]>;
  projectCode: string;
  onSelectCase?: (testCase: any) => void;
}

export function SuiteNode({ suite, depth, childrenMap, casesBySuiteId, projectCode, onSelectCase }: SuiteNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuickTest, setShowQuickTest] = useState(false);
  const [quickTestTitle, setQuickTestTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { role } = useProjectRole();

  const children = childrenMap.get(suite.id) || [];
  const cases = casesBySuiteId.get(suite.id) || [];

  // Root has bg-surface-hover, children have bg-background or bg-surface
  const headerBgClass = depth === 0 ? "bg-surface-hover text-text-main shadow-sm" 
                      : depth === 1 ? "bg-surface text-text-muted" 
                      : "bg-background text-text-muted";
                      
  const handleCreateQuickTest = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTestTitle.trim() && !isCreating) {
      setIsCreating(true);
      try {
        const res = await fetch(`/api/projects/${projectCode}/cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quickTestTitle.trim(),
            suiteId: suite.id,
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
    <div className={cn("flex flex-col", depth > 0 && "ml-4 mt-2")}>
      {/* Suite Header */}
      <div 
        className={cn("group flex items-center justify-between px-4 py-2.5 rounded-md transition-colors", headerBgClass)}
      >
        <div 
          className="flex items-center cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown size={18} className="mr-2 text-text-muted" />
          ) : (
            <ChevronRight size={18} className="mr-2 text-text-muted" />
          )}
          <span className={cn("font-bold", depth === 0 ? "text-base" : "text-sm")}>
            {suite.title}
          </span>
        </div>

        {/* Hover Actions */}
        {role !== 'VIEWER' && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setShowQuickTest(true)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Create quick test"
            >
              <Plus size={16} />
            </button>
            <button className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors">
              <Edit2 size={16} />
            </button>
            <button className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors">
              <Copy size={16} />
            </button>
            <button className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Suite Content (Cases and Child Suites) */}
      {isExpanded && (
        <div className={cn("flex flex-col", depth === 0 && "pl-2")}>
          
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
            <div className="flex flex-col mt-1 bg-background rounded-md overflow-hidden border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
              {cases.map((tc: any) => (
                <div 
                  key={tc.id} 
                  className="group flex items-center px-4 py-2 border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSelectCase) {
                      onSelectCase(tc);
                    } else {
                      router.push(`/projects/${projectCode}/cases/${tc.id}/edit`);
                    }
                  }}
                >
                  {role !== 'VIEWER' ? (
                    <GripVertical size={14} className="text-text-muted/50 mr-3 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity" />
                  ) : (
                    <div className="w-[14px] mr-3"></div>
                  )}
                  <div className="w-24 shrink-0 text-[13px] text-text-muted font-mono">
                    {tc.code || `${projectCode}-${tc.id.substring(0,4)}`}
                  </div>
                  <div className="flex-1 flex items-center text-[13px] font-normal text-text-main group-hover:text-primary transition-colors min-w-0">
                    {tc.tags?.some((t: any) => t.name === "AI-Generated") ? (
                      <span title="AI Generated" className="shrink-0 flex items-center">
                        <Sparkles size={14} className="text-amber-500 mr-2" />
                      </span>
                    ) : (
                      <span title="Manually Created" className="shrink-0 flex items-center">
                        <User size={14} className="text-blue-400 mr-2" />
                      </span>
                    )}
                    <span className="truncate">{tc.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {tc.tags && tc.tags.filter((t: any) => t.name !== "AI-Generated").length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-surface text-text-muted rounded border border-border/50">
                        {tc.tags.filter((t: any) => t.name !== "AI-Generated")[0].name}
                      </span>
                    )}
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
                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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
                <div className="px-6 py-2 bg-surface-hover/30 border-t border-border/50 transition-colors">
                  <button 
                    onClick={() => setShowQuickTest(true)}
                    className="text-xs font-medium text-text-muted hover:text-primary flex items-center transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> Create quick test
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Child Suites */}
          {children.length > 0 && (
            <div className="mt-1">
              {children.map(childSuite => (
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
      )}
    </div>
  );
}
