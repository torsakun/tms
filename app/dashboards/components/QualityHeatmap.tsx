"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

interface QualityHeatmapProps {
  heatmapData: Array<{
    code: string;
    name: string;
    dailyHealth: Array<{
      date: string;
      passRate: number | null;
      totalRuns: number;
    }>;
  }>;
}

export function QualityHeatmap({ heatmapData }: QualityHeatmapProps) {
  const getCellColor = (passRate: number | null) => {
    if (passRate === null) return "bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30";
    if (passRate >= 90) return "bg-emerald-500 hover:bg-emerald-600 shadow-xs";
    if (passRate >= 70) return "bg-emerald-300 hover:bg-emerald-400 shadow-2xs";
    if (passRate >= 50) return "bg-amber-400 hover:bg-amber-500 shadow-2xs";
    return "bg-rose-500 hover:bg-rose-600 shadow-xs";
  };

  const getCellTooltip = (date: string, passRate: number | null) => {
    const formattedDate = new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (passRate === null) return `${formattedDate}: No runs executed`;
    return `${formattedDate}: Pass Rate ${passRate.toFixed(1)}%`;
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-transparent">
        <h2 className="text-base font-extrabold text-text-main flex items-center">
          <CheckCircle
            className="mr-2 text-indigo-600"
            size={18}
            strokeWidth={2.5}
          />
          Quality Grid (30-day History)
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30" />
          <span className="w-2.5 h-2.5 rounded bg-rose-500" />
          <span className="w-2.5 h-2.5 rounded bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-300" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
      <div className="p-6 overflow-x-auto flex-1">
        {heatmapData.length === 0 ? (
          <div className="text-center py-8 text-text-muted font-medium text-sm">
            No project metrics found.
          </div>
        ) : (
          <div className="space-y-4 min-w-[760px]">
            {heatmapData.map((project) => (
              <div key={project.code} className="flex items-center justify-between gap-4">
                <div className="w-40 shrink-0 flex flex-col">
                  <span className="text-xs font-bold text-text-main truncate">
                    {project.name}
                  </span>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1 py-0.2 rounded w-max mt-0.5">
                    {project.code}
                  </span>
                </div>
                <div className="flex-1 flex gap-[3px] justify-end">
                  {project.dailyHealth.map((day) => (
                    <div
                      key={day.date}
                      title={getCellTooltip(day.date, day.passRate)}
                      className={`w-4.5 h-4.5 rounded transition-all cursor-pointer ${getCellColor(day.passRate)}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
