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
    if (passRate === null) {
      return "border-border/60 bg-surface-hover";
    }
    if (passRate >= 90) return "border-emerald-600/20 bg-emerald-500";
    if (passRate >= 70) return "border-emerald-500/20 bg-emerald-300";
    if (passRate >= 50) return "border-amber-500/25 bg-amber-400";
    return "border-rose-600/25 bg-rose-500";
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
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-premium">
      <div className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-4">
        <h2 className="flex items-center text-base font-extrabold text-text-main">
          <CheckCircle
            className="mr-2 text-primary"
            size={18}
            strokeWidth={2.5}
          />
          Quality Grid
        </h2>
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] border border-border/60 bg-surface-hover" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-rose-600/20 bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-amber-500/20 bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-500/20 bg-emerald-300" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-600/20 bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-5">
        {heatmapData.length === 0 ? (
          <div className="text-center py-8 text-text-muted font-medium text-sm">
            No project metrics found.
          </div>
        ) : (
          <div className="space-y-4">
            {heatmapData.map((project) => {
              const active = project.dailyHealth.filter(
                (d) => d.passRate !== null,
              );
              const avg = active.length
                ? Math.round(
                    active.reduce((s, d) => s + (d.passRate || 0), 0) /
                      active.length,
                  )
                : null;
              const last = [...project.dailyHealth]
                .reverse()
                .find((d) => d.passRate !== null);
              const avgColor =
                avg === null
                  ? "var(--text-muted)"
                  : avg >= 90
                    ? "#10b981"
                    : avg >= 70
                      ? "#22c55e"
                      : avg >= 50
                        ? "#f59e0b"
                        : "#ef4444";
              return (
                <div key={project.code} className="relative flex items-center gap-4">
                  <div className="sticky left-0 z-10 flex w-32 shrink-0 flex-col bg-surface pr-3">
                    <span className="text-xs font-bold text-text-main truncate">
                      {project.name}
                    </span>
                    <span className="mt-1.5 w-max rounded border border-primary/15 bg-primary-light px-1.5 py-0.5 text-xs font-bold text-primary">
                      {project.code}
                    </span>
                  </div>
                  <div className="relative flex flex-1 justify-end gap-1">
                    {project.dailyHealth.map((day) => (
                      <div
                        key={day.date}
                        title={getCellTooltip(day.date, day.passRate)}
                        className={`h-3.5 w-3.5 shrink-0 cursor-pointer rounded-[3px] border transition-transform duration-150 hover:z-20 hover:scale-125 ${getCellColor(day.passRate)}`}
                      />
                    ))}
                  </div>
                  {/* Per-project summary — keeps the row informative when cells are sparse */}
                  <div className="flex w-28 shrink-0 flex-col items-end border-l border-border/60 pl-3">
                    <span
                      className="text-base font-extrabold leading-none"
                      style={{ color: avgColor }}
                    >
                      {avg === null ? "—" : `${avg}%`}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold text-text-muted">
                      avg · {active.length} active{active.length === 1 ? " day" : " days"}
                    </span>
                    <span className="mt-0.5 text-[10px] text-text-muted">
                      {last
                        ? `last ${new Date(last.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                        : "never run"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
