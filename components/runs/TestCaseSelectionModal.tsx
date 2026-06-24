"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Suite {
  id: string;
  title: string;
  children?: Suite[];
}

interface TestCaseDTO {
  id: string;
  code?: string;
  title: string;
  status?: string;
  priority?: string;
  suiteId?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedIds: Set<string>) => void;
  suites: Suite[];
  cases: TestCaseDTO[];
  initialSelectedIds: Set<string>;
}

export function TestCaseSelectionModal({
  isOpen,
  onClose,
  onSave,
  suites,
  cases,
  initialSelectedIds,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [caseSearch, setCaseSearch] = useState("");
  const [searchScope, setSearchScope] = useState<"all" | "title">("all");
  const [activeSuiteId, setActiveSuiteId] = useState<
    string | "all" | "unassigned"
  >("all");
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  // Compute relationship helpers
  const { casesBySuite, allCaseIds, unassignedCases } = useMemo(() => {
    const map = new Map<string, TestCaseDTO[]>();
    const allIds = new Set<string>();
    const unassigned: TestCaseDTO[] = [];

    cases.forEach((c) => {
      allIds.add(c.id);
      if (!c.suiteId) {
        unassigned.push(c);
      } else {
        if (!map.has(c.suiteId)) map.set(c.suiteId, []);
        map.get(c.suiteId)!.push(c);
      }
    });
    return {
      casesBySuite: map,
      allCaseIds: allIds,
      unassignedCases: unassigned,
    };
  }, [cases]);

  // Recursively gather all case IDs under a specific suite and its descendants
  const getSubTreeCaseIds = (suite: Suite): string[] => {
    let ids: string[] = [];
    const directCases = casesBySuite.get(suite.id) || [];
    ids.push(...directCases.map((c) => c.id));
    if (suite.children) {
      suite.children.forEach((child) => {
        ids.push(...getSubTreeCaseIds(child));
      });
    }
    return ids;
  };

  // Total count across all
  const isAllSelected =
    selectedIds.size === allCaseIds.size && allCaseIds.size > 0;
  const isSomeSelected =
    selectedIds.size > 0 && selectedIds.size < allCaseIds.size;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allCaseIds));
    }
  };

  const toggleSuite = (suiteId: string, suiteCaseIds: string[]) => {
    const newSelected = new Set(selectedIds);
    // Check if currently entirely selected
    const allSelected =
      suiteCaseIds.length > 0 &&
      suiteCaseIds.every((id) => newSelected.has(id));

    suiteCaseIds.forEach((id) => {
      if (allSelected) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    });
    setSelectedIds(newSelected);
  };

  const toggleUnassigned = () => {
    const ids = unassignedCases.map((c) => c.id);
    const newSelected = new Set(selectedIds);
    const allSelected =
      ids.length > 0 && ids.every((id) => newSelected.has(id));
    ids.forEach((id) => {
      if (allSelected) newSelected.delete(id);
      else newSelected.add(id);
    });
    setSelectedIds(newSelected);
  };

  const toggleCase = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSave = () => {
    onSave(selectedIds);
  };

  // Render deeply nested suites
  const renderSuiteTree = (suiteList: Suite[], level: number = 0) => {
    return suiteList.map((suite) => {
      const suiteCaseIds = getSubTreeCaseIds(suite);
      const selectedCount = suiteCaseIds.filter((id) =>
        selectedIds.has(id),
      ).length;
      const totalCount = suiteCaseIds.length;
      const isSuiteSelected = selectedCount === totalCount && totalCount > 0;
      const isSuiteIndeterminate =
        selectedCount > 0 && selectedCount < totalCount;
      const isExpanded = expandedSuites.has(suite.id);

      const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedSuites);
        if (isExpanded) next.delete(suite.id);
        else next.add(suite.id);
        setExpandedSuites(next);
      };

      return (
        <div key={suite.id} className="select-none">
          <div
            className={`flex items-center group cursor-pointer transition-colors ${activeSuiteId === suite.id ? "bg-surface-hover" : "hover:bg-surface-hover/50"}`}
            style={{
              paddingLeft: `${level * 1.5 + 0.75}rem`,
              paddingRight: "1rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
            }}
            onClick={() => setActiveSuiteId(suite.id)}
          >
            <div
              className="w-5 h-5 flex items-center justify-center shrink-0 mr-1 opacity-50 hover:opacity-100"
              onClick={toggleExpand}
            >
              {suite.children && suite.children.length > 0 ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : null}
            </div>

            <button
              type="button"
              className="mr-2 text-text-muted focus:outline-none flex shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleSuite(suite.id, suiteCaseIds);
              }}
            >
              {isSuiteSelected ? (
                <CheckSquare size={16} className="text-primary" />
              ) : isSuiteIndeterminate ? (
                <div className="w-4 h-4 rounded text-primary border border-primary flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-primary rounded"></div>
                </div>
              ) : (
                <Square size={16} />
              )}
            </button>
            <span className="text-sm font-medium text-text-main truncate flex-1 leading-none">
              {suite.title}
            </span>
            <span className="text-xs text-text-muted font-mono shrink-0 ml-2">
              {selectedCount}/{totalCount}
            </span>
          </div>

          {isExpanded && suite.children && (
            <div>{renderSuiteTree(suite.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  // Determine what cases to show on the right
  let displayCases: TestCaseDTO[] = [];
  let displayTitle = "All Cases";
  let activeSuiteSelectionIds: string[] = [];

  if (activeSuiteId === "all") {
    displayCases = cases;
    displayTitle = "All tests";
    activeSuiteSelectionIds = Array.from(allCaseIds);
  } else if (activeSuiteId === "unassigned") {
    displayCases = unassignedCases;
    displayTitle = "Test cases without suite";
    activeSuiteSelectionIds = unassignedCases.map((c) => c.id);
  } else {
    // Find active suite
    const findSuite = (suites: Suite[], id: string): Suite | null => {
      for (const s of suites) {
        if (s.id === id) return s;
        if (s.children) {
          const found = findSuite(s.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const s = findSuite(suites, activeSuiteId);
    if (s) {
      displayTitle = s.title;
      displayCases = casesBySuite.get(s.id) || [];
      activeSuiteSelectionIds = displayCases.map((c) => c.id);
    }
  }

  // Apply search filter to the displayed cases
  const q = caseSearch.trim().toLowerCase();
  if (q) {
    displayCases = displayCases.filter((c: any) => {
      const title = (c.title || "").toLowerCase();
      if (title.includes(q)) return true;
      if (searchScope === "title") return false;
      const code = (c.code || "").toLowerCase();
      return code.includes(q);
    });
    activeSuiteSelectionIds = displayCases.map((c) => c.id);
  }

  const activePaneSelectedCount = activeSuiteSelectionIds.filter((id) =>
    selectedIds.has(id),
  ).length;
  const isActivePaneAllSelected =
    activePaneSelectedCount === activeSuiteSelectionIds.length &&
    activeSuiteSelectionIds.length > 0;
  const isActivePaneIndeterminate =
    activePaneSelectedCount > 0 &&
    activePaneSelectedCount < activeSuiteSelectionIds.length;

  const handleActivePaneToggle = () => {
    const newSet = new Set(selectedIds);
    if (isActivePaneAllSelected) {
      activeSuiteSelectionIds.forEach((id) => newSet.delete(id));
    } else {
      activeSuiteSelectionIds.forEach((id) => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-sm p-4 sm:p-6 md:p-12 overflow-hidden">
      <div className="flex-1 bg-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col overflow-hidden w-full max-w-6xl mx-auto border border-border">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-text-main">
              Select test cases
            </h1>
            <span className="text-sm font-medium text-text-muted">
              {selectedIds.size} case{selectedIds.size !== 1 && "s"} selected
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-t border-border/50 bg-background flex space-x-3 shrink-0">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-2 text-text-muted"
              size={16}
            />
            <input
              type="text"
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              placeholder="Search for cases"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface border border-border text-text-main rounded focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <select
            value={searchScope}
            onChange={(e) => setSearchScope(e.target.value as "all" | "title")}
            className="px-3 py-1.5 text-sm bg-surface border border-border text-text-main rounded focus:outline-none transition-colors"
          >
            <option value="all">By all fields</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (Suites) */}
          <aside className="w-[300px] border-r border-border/50 flex flex-col bg-surface overflow-y-auto shrink-0">
            <div className="py-2">
              {/* Select All global */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${activeSuiteId === "all" ? "bg-surface-hover" : "hover:bg-surface-hover/50"}`}
                onClick={() => setActiveSuiteId("all")}
              >
                <div className="w-5 h-5 mr-1 shrink-0"></div>
                <button
                  type="button"
                  className="mr-2 text-text-muted flex shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAll();
                  }}
                >
                  {isAllSelected ? (
                    <CheckSquare size={16} className="text-primary" />
                  ) : isSomeSelected ? (
                    <div className="w-4 h-4 rounded text-primary border border-primary flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-primary rounded"></div>
                    </div>
                  ) : (
                    <Square size={16} />
                  )}
                </button>
                <span className="text-sm font-semibold text-text-main truncate flex-1">
                  Select all
                </span>
                <span className="text-xs text-text-muted font-mono shrink-0">
                  {selectedIds.size}/{allCaseIds.size}
                </span>
              </div>

              {/* Unassigned cases */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${activeSuiteId === "unassigned" ? "bg-surface-hover" : "hover:bg-surface-hover/50"}`}
                onClick={() => setActiveSuiteId("unassigned")}
              >
                <div className="w-5 h-5 mr-1 shrink-0"></div>
                <button
                  type="button"
                  className="mr-2 text-text-muted flex shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUnassigned();
                  }}
                >
                  {unassignedCases.length > 0 &&
                  unassignedCases.every((c) => selectedIds.has(c.id)) ? (
                    <CheckSquare size={16} className="text-primary" />
                  ) : unassignedCases.some((c) => selectedIds.has(c.id)) ? (
                    <div className="w-4 h-4 rounded text-primary border border-primary flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-primary rounded"></div>
                    </div>
                  ) : (
                    <Square size={16} />
                  )}
                </button>
                <span className="text-sm font-medium text-text-main truncate flex-1">
                  Test cases without suite
                </span>
                <span className="text-xs text-text-muted font-mono shrink-0">
                  {unassignedCases.filter((c) => selectedIds.has(c.id)).length}/
                  {unassignedCases.length}
                </span>
              </div>

              {/* Suites Tree */}
              {renderSuiteTree(suites)}
            </div>
          </aside>

          {/* Right Main Area (Cases) */}
          <main className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
            <header className="px-6 py-4 border-b border-border/50 shrink-0">
              <h2 className="text-lg font-bold text-text-main">
                {displayTitle}
              </h2>
            </header>

            <div className="px-6 py-2 border-b border-border/50 flex items-center bg-background shrink-0 select-none">
              <button
                type="button"
                className="mr-3 text-text-muted focus:outline-none flex"
                onClick={handleActivePaneToggle}
              >
                {isActivePaneAllSelected ? (
                  <CheckSquare size={16} className="text-primary" />
                ) : isActivePaneIndeterminate ? (
                  <div className="w-4 h-4 rounded text-primary border border-primary flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-primary rounded"></div>
                  </div>
                ) : (
                  <Square size={16} />
                )}
              </button>
              <span className="text-sm font-semibold text-text-main">
                Select all
              </span>
              <span className="text-xs font-mono text-text-muted ml-2">
                {activePaneSelectedCount}/{activeSuiteSelectionIds.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {displayCases.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  No cases in this suite.
                </div>
              ) : (
                <div className="space-y-1">
                  {displayCases.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center p-2 rounded hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => toggleCase(c.id)}
                    >
                      <button
                        type="button"
                        className="mr-3 text-text-muted focus:outline-none shrink-0"
                      >
                        {selectedIds.has(c.id) ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <div className="flex-1 flex items-center min-w-0">
                        <span className="text-sm font-medium text-text-main truncate mr-3">
                          {c.code || "TC-?"}
                        </span>
                        <span className="text-sm text-text-main truncate">
                          {c.title}
                        </span>
                      </div>
                      <div className="shrink-0 ml-4 flex space-x-2">
                        <span className="px-2 py-0.5 bg-background border border-border text-text-muted rounded text-[10px] font-bold uppercase">
                          {c.status || "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border/50 bg-surface flex justify-end space-x-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  );
}
