"use client";

import React, { useMemo, useEffect } from "react";
import { SuiteNode } from "./SuiteNode";
import { Folder } from "lucide-react";

interface SuiteListProps {
  suites: any[];
  cases: any[];
  activeSuiteId: string | null;
  projectCode: string;
  onSelectCase?: (testCase: any) => void;
  searchQuery?: string;
  searchScope?: "all" | "title";
}

export function SuiteList({
  suites,
  cases,
  activeSuiteId,
  projectCode,
  onSelectCase,
  searchQuery = "",
  searchScope = "all",
}: SuiteListProps) {
  const q = searchQuery.trim().toLowerCase();
  const filteredCases = useMemo(() => {
    if (!q) return cases;
    return cases.filter((tc) => {
      const title = (tc.title || "").toLowerCase();
      if (title.includes(q)) return true;
      if (searchScope === "title") return false;
      const code =
        `${projectCode}-${tc.sequenceNumber || tc.id?.substring(0, 2)}`.toLowerCase();
      const desc = (tc.description || "").toLowerCase();
      return code.includes(q) || desc.includes(q);
    });
  }, [cases, q, projectCode, searchScope]);
  // Scroll to active suite when activeSuiteId changes
  useEffect(() => {
    if (activeSuiteId) {
      const el = document.getElementById(`suite-${activeSuiteId}`);
      if (el) {
        // slight delay to ensure it's rendered and expanded
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [activeSuiteId]);

  // Build tree from flat array
  const { roots, childrenMap } = useMemo(() => {
    const cMap = new Map<string, any[]>();
    const rootList: any[] = [];

    suites.forEach((suite) => {
      cMap.set(suite.id, []);
    });

    suites.forEach((suite) => {
      if (suite.parentId && cMap.has(suite.parentId)) {
        cMap.get(suite.parentId)!.push(suite);
      } else {
        rootList.push(suite);
      }
    });

    return { roots: rootList, childrenMap: cMap };
  }, [suites]);

  // Group cases by suiteId
  const casesBySuiteId = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filteredCases.forEach((tc) => {
      const sId = tc.suiteId || "unassigned";
      if (!grouped.has(sId)) grouped.set(sId, []);
      grouped.get(sId)!.push(tc);
    });
    return grouped;
  }, [filteredCases]);

  // When searching, only show suites that have matching cases in their subtree
  const visibleRoots = useMemo(() => {
    if (!q) return roots;
    const subtreeHasMatch = (suite: any): boolean => {
      if ((casesBySuiteId.get(suite.id) || []).length > 0) return true;
      return (childrenMap.get(suite.id) || []).some(subtreeHasMatch);
    };
    return roots.filter(subtreeHasMatch);
  }, [roots, childrenMap, casesBySuiteId, q]);

  const unassignedCases = casesBySuiteId.get("unassigned") || [];

  if (q && visibleRoots.length === 0 && unassignedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-border border-dashed">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-3">
          <Folder size={28} />
        </div>
        <h3 className="text-base font-bold text-text-main mb-1">
          No matching test cases
        </h3>
        <p className="text-sm text-text-muted text-center max-w-sm">
          No cases match &ldquo;{searchQuery}&rdquo;. Try a different search.
        </p>
      </div>
    );
  }

  if (suites.length === 0 && unassignedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-border border-dashed transition-colors">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 transition-colors">
          <Folder size={32} />
        </div>
        <h3 className="text-lg font-semibold text-text-main mb-2">
          No Suites Found
        </h3>
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">
          Create your first test suite to start organizing your test cases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleRoots.map((suite, i) => (
        <div
          key={suite.id}
          className="flex flex-col animate-list-in"
          style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
        >
          <SuiteNode
            suite={suite}
            depth={0}
            childrenMap={childrenMap}
            casesBySuiteId={casesBySuiteId}
            projectCode={projectCode}
            onSelectCase={onSelectCase}
            allSuites={suites}
          />
        </div>
      ))}

      {unassignedCases.length > 0 && (
        <SuiteNode
          suite={{ id: "unassigned", title: "Unassigned Test Cases" }}
          depth={0}
          childrenMap={childrenMap}
          casesBySuiteId={casesBySuiteId}
          projectCode={projectCode}
          onSelectCase={onSelectCase}
          isUnassigned={true}
          allSuites={suites}
        />
      )}
    </div>
  );
}
