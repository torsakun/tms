"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, Folder, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    <section className="flex flex-wrap items-center gap-2">
      <div className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-3 text-[13px] font-semibold shadow-sm">
        <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-primary-light text-primary">
          <Filter size={14} />
        </span>
        Dashboard filters
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[34px] min-w-0 items-center gap-[7px] rounded-[9px] border border-border bg-surface px-3 text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 sm:min-w-[260px]">
            <Folder size={15} className="shrink-0 text-primary" />
            <span className="sr-only">Project</span>
            <select
              value={projectCode}
              onChange={handleProjectChange}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-[13px] font-semibold text-text-main outline-none"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-3 text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
            <Calendar size={15} className="shrink-0 text-primary" />
            <span className="sr-only">Timeframe</span>
            <select
              value={timeframe}
              onChange={handleTimeframeChange}
              className="cursor-pointer bg-transparent text-[13px] font-semibold text-text-main outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </label>

          {(projectCode || timeframe !== "14") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              className="h-[34px] rounded-[9px] text-text-muted hover:border-primary/35 hover:text-text-main"
            >
              <RotateCcw size={15} />
              Reset
            </Button>
          )}
      </div>
    </section>
  );
}
