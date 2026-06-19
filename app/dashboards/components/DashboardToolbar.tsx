"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, Folder, RotateCcw } from "lucide-react";

interface DashboardToolbarProps {
  projects: Array<{ code: string; name: string }>;
}

export function DashboardToolbar({ projects }: DashboardToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeframe = searchParams?.get("timeframe") || "14";
  const projectCode = searchParams?.get("project") || "";

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("timeframe", e.target.value);
    router.push(`/dashboards?${params.toString()}`);
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (e.target.value) {
      params.set("project", e.target.value);
    } else {
      params.delete("project");
    }
    router.push(`/dashboards?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push("/dashboards");
  };

  return (
    <section className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-text-main">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-primary-light text-primary">
            <Filter size={15} />
          </span>
          Dashboard filters
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <label className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 sm:min-w-[260px]">
            <Folder size={15} className="shrink-0 text-primary" />
            <span className="sr-only">Project</span>
            <select
              value={projectCode}
              onChange={handleProjectChange}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-semibold text-text-main outline-none"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
            <Calendar size={15} className="shrink-0 text-primary" />
            <span className="sr-only">Timeframe</span>
            <select
              value={timeframe}
              onChange={handleTimeframeChange}
              className="cursor-pointer bg-transparent text-sm font-semibold text-text-main outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </label>

          {(projectCode || timeframe !== "14") && (
            <button
              onClick={handleClearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-bold text-text-muted hover:border-primary/35 hover:bg-surface-hover hover:text-text-main"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
