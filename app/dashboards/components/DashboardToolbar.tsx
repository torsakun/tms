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
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border rounded-xl shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Project Filter */}
        <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 gap-2 shadow-2xs">
          <Folder size={14} className="text-text-muted" />
          <select
            value={projectCode}
            onChange={handleProjectChange}
            className="bg-transparent text-xs font-semibold text-text-main focus:outline-none cursor-pointer pr-4"
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
        <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 gap-2 shadow-2xs">
          <Calendar size={14} className="text-text-muted" />
          <select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="bg-transparent text-xs font-semibold text-text-main focus:outline-none cursor-pointer pr-4"
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
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
