"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Folder } from "lucide-react";

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
    <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-surface/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Project Filter */}
        <div className="flex items-center bg-background border border-border/80 rounded-xl px-3.5 py-2 gap-2.5 shadow-2xs hover:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all duration-200">
          <Folder size={14} className="text-indigo-500" />
          <select
            value={projectCode}
            onChange={handleProjectChange}
            className="bg-transparent text-xs font-bold text-text-main focus:outline-none cursor-pointer pr-3 outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center bg-background border border-border/80 rounded-xl px-3.5 py-2 gap-2.5 shadow-2xs hover:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/50 transition-all duration-200">
          <Calendar size={14} className="text-violet-500" />
          <select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="bg-transparent text-xs font-bold text-text-main focus:outline-none cursor-pointer pr-3 outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {(projectCode || timeframe !== "14") && (
        <button
          onClick={handleClearFilters}
          className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 active:bg-indigo-100 border border-indigo-200/60 rounded-xl px-3 py-2 shadow-sm transition-all duration-200"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
