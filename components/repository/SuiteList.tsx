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
  priorityFilter?: Set<string>;
  automationFilter?: Set<string>;
}

export function SuiteList({
  suites,
  cases,
  activeSuiteId,
  projectCode,
  onSelectCase,
  searchQuery = "",
  searchScope = "all",
  priorityFilter,
  automationFilter,
}: SuiteListProps) {
  const q = searchQuery.trim().toLowerCase();
  const filteredCases = useMemo(() => {
    const hasPriority = priorityFilter && priorityFilter.size > 0;
    const hasAutomation = automationFilter && automationFilter.size > 0;
    return cases.filter((tc) => {
      // Text search
      if (q) {
        const title = (tc.title || "").toLowerCase();
        const titleHit = title.includes(q);
        if (searchScope === "title") {
          if (!titleHit) return false;
        } else if (!titleHit) {
          const code =
            `${projectCode}-${tc.sequenceNumber || tc.id?.substring(0, 2)}`.toLowerCase();
          const desc = (tc.description || "").toLowerCase();
          if (!code.includes(q) && !desc.includes(q)) return false;
        }
      }
      // Advanced filters
      if (
        hasPriority &&
        !priorityFilter!.has((tc.priority || "NOT_SET").toUpperCase())
      )
        return false;
      if (
        hasAutomation &&
        !automationFilter!.has((tc.automationStatus || "MANUAL").toUpperCase())
      )
        return false;
      return true;
    });
  }, [cases, q, projectCode, searchScope, priorityFilter, automationFilter]);
  const isFiltering =
    !!q ||
    (priorityFilter?.size || 0) > 0 ||
    (automationFilter?.size || 0) > 0;
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
    if (!isFiltering) return roots;
    const subtreeHasMatch = (suite: any): boolean => {
      if ((casesBySuiteId.get(suite.id) || []).length > 0) return true;
      return (childrenMap.get(suite.id) || []).some(subtreeHasMatch);
    };
    return roots.filter(subtreeHasMatch);
  }, [roots, childrenMap, casesBySuiteId, isFiltering]);

  const unassignedCases = casesBySuiteId.get("unassigned") || [];

  if (isFiltering && visibleRoots.length === 0 && unassignedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border/80 border-dashed">
        <div className="w-14 h-14 bg-primary-light text-primary rounded-full flex items-center justify-center mb-3 shadow-sm">
          <Folder size={28} />
        </div>
        <h3 className="text-base font-bold text-text-main mb-1">
          No matching test cases
        </h3>
        <p className="text-sm text-text-muted text-center max-w-sm">
          {q
            ? `No cases match “${searchQuery}”. Try a different search or filter.`
            : "No cases match the selected filters."}
        </p>
      </div>
    );
  }

  if (suites.length === 0 && unassignedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border/80 border-dashed transition-colors">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 transition-colors shadow-sm">
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
