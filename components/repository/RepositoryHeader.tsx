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
      <div className="flex-none px-6 py-3.5 border-b bg-white" style={{ borderColor: "#e8eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">{projectCode}</h1>
          <span className="text-slate-300">/</span>
          <span className="text-xl font-bold text-slate-800">Repository</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {totalCases} cases
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {selectedCases.size} selected · {selectedSuitesCount} suite{selectedSuitesCount !== 1 ? "s" : ""}
            <button
              onClick={clearSelection}
              className="ml-1 text-indigo-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-100 p-0.5"
            >
              <X size={13} />
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-none px-6 py-3.5 border-b bg-white" style={{ borderColor: "#e8eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{projectCode}</h1>
        <span className="text-slate-300">/</span>
        <span className="text-xl font-bold text-slate-800">Repository</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
          {totalCases} cases
        </span>
        <span className="text-[11px] font-medium text-slate-400">
          {totalSuites} suites
        </span>
      </div>
    </div>
  );
}
