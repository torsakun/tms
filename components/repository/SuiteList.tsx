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
}

export function SuiteList({ suites, cases, activeSuiteId, projectCode, onSelectCase }: SuiteListProps) {
  // Scroll to active suite when activeSuiteId changes
  useEffect(() => {
    if (activeSuiteId) {
      const el = document.getElementById(`suite-${activeSuiteId}`);
      if (el) {
        // slight delay to ensure it's rendered and expanded
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [activeSuiteId]);

  // Build tree from flat array
  const { roots, childrenMap } = useMemo(() => {
    const cMap = new Map<string, any[]>();
    const rootList: any[] = [];

    suites.forEach(suite => {
      cMap.set(suite.id, []);
    });

    suites.forEach(suite => {
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
    cases.forEach(tc => {
      const sId = tc.suiteId || 'unassigned';
      if (!grouped.has(sId)) grouped.set(sId, []);
      grouped.get(sId)!.push(tc);
    });
    return grouped;
  }, [cases]);

  const unassignedCases = casesBySuiteId.get('unassigned') || [];

  if (suites.length === 0 && unassignedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-border border-dashed transition-colors">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 transition-colors">
          <Folder size={32} />
        </div>
        <h3 className="text-lg font-semibold text-text-main mb-2">No Suites Found</h3>
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">
          Create your first test suite to start organizing your test cases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roots.map(suite => (
        <div key={suite.id} className="flex flex-col">
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
      
      {unassignedCases.length > 0 && !activeSuiteId && (
        <SuiteNode 
          suite={{ id: 'unassigned', title: 'Unassigned Test Cases' }} 
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
