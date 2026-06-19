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
    if (passRate === null) return "bg-slate-100 dark:bg-slate-800/30 border border-slate-200/10 dark:border-slate-800/40";
    if (passRate >= 90) return "bg-[#10b981] hover:bg-[#34d399] border border-emerald-600/25 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
    if (passRate >= 70) return "bg-[#34d399]/85 hover:bg-[#6ee7b7] border border-emerald-500/25 shadow-[0_0_6px_rgba(52,211,153,0.15)]";
    if (passRate >= 50) return "bg-[#fbbf24] hover:bg-[#fcd34d] border border-amber-500/25 shadow-[0_0_6px_rgba(251,191,36,0.15)]";
    return "bg-[#f43f5e] hover:bg-[#fb7185] border border-rose-600/25 shadow-[0_0_8px_rgba(244,63,94,0.25)]";
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
          <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-100 dark:bg-slate-800/30 border border-slate-200/10" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f43f5e] border border-rose-600/20" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#fbbf24] border border-amber-500/20" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#34d399]/85 border border-emerald-500/20" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#10b981] border border-emerald-600/20" />
          <span>More</span>
        </div>
      </div>
      <div className="p-6 overflow-x-auto flex-1 scrollbar-thin">
        {heatmapData.length === 0 ? (
          <div className="text-center py-8 text-text-muted font-medium text-sm">
            No project metrics found.
          </div>
        ) : (
          <div className="space-y-4">
            {heatmapData.map((project) => (
              <div key={project.code} className="flex items-center justify-between gap-4 relative">
                <div className="w-32 shrink-0 flex flex-col sticky left-0 bg-surface z-10 pr-2 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  <span className="text-xs font-bold text-text-main truncate">
                    {project.name}
                  </span>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-xs w-max mt-1.5">
                    {project.code}
                  </span>
                </div>
                <div className="flex-1 flex gap-[2.5px] justify-end relative">
                  {project.dailyHealth.map((day) => (
                    <div
                      key={day.date}
                      title={getCellTooltip(day.date, day.passRate)}
                      className={`w-3.5 h-3.5 rounded-[2px] shrink-0 transition-all cursor-pointer hover:scale-125 hover:z-20 hover:shadow-md duration-150 ${getCellColor(day.passRate)}`}
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
