"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { useSuiteSelection } from "@/components/providers/SuiteSelectionProvider";

interface RepositoryHeaderProps {
  projectCode: string;
  totalCases: number;
  totalSuites: number;
  cases: any[];
}

export function RepositoryHeader({ projectCode, totalCases, totalSuites, cases }: RepositoryHeaderProps) {
  const { selectedCases, clearSelection } = useSuiteSelection();

  // Calculate unique suites that have selected cases
  const selectedSuitesCount = useMemo(() => {
    if (selectedCases.size === 0) return 0;
    const suiteIds = new Set<string>();
    cases.forEach(c => {
      if (selectedCases.has(c.id) && c.suiteId) {
        suiteIds.add(c.suiteId);
      }
    });
    return suiteIds.size;
  }, [selectedCases, cases]);

  if (selectedCases.size > 0) {
    return (
      <div className="flex-none px-6 py-4 border-b border-border/50 bg-white">
        <div className="flex items-center space-x-3 h-[32px]">
          <h1 className="text-2xl font-bold text-slate-800">{projectCode} repository</h1>
          <span className="text-[13px] text-slate-500 font-medium">
            {totalCases} cases ({totalCases}) | {totalSuites} suites ({totalSuites})
          </span>
          <span className="text-slate-300 mx-2">|</span>
          <span className="text-[13px] text-slate-800 font-bold flex items-center">
            Selected: {selectedCases.size} cases | {selectedSuitesCount} suite{selectedSuitesCount !== 1 ? 's' : ''}
            <button 
              onClick={clearSelection}
              className="ml-2 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100 p-0.5"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-none px-6 py-4 border-b border-border/50 bg-white">
      <div className="flex items-baseline space-x-3 h-[32px]">
        <h1 className="text-2xl font-bold text-slate-800">{projectCode} repository</h1>
        <span className="text-[13px] text-slate-500 font-medium">
          {totalCases} cases ({totalCases}) | {totalSuites} suites ({totalSuites})
        </span>
      </div>
    </div>
  );
}
