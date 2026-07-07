"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Filter } from "lucide-react";

type DashboardFiltersProps = {
  projects: Array<{ code: string; name: string }>;
  selectedProject: string;
  timeframe: number;
};

const timeframes = [7, 14, 30, 60, 90];

export function DashboardFilters({
  projects,
  selectedProject,
  timeframe,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: "project" | "timeframe", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || (key === "timeframe" && value === "30")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.push(query ? `/dashboards?${query}` : "/dashboards");
  };

  return (
    <div className="flex items-center gap-[8px]">
      <label className="relative flex h-[34px] min-w-[160px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <Filter size={17} className="shrink-0 text-text-faint" />
        <span className="sr-only">Project filter</span>
        <select
          value={selectedProject}
          onChange={(event) => updateFilter("project", event.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-[22px] text-[13px] font-medium text-text-main outline-none"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.code} value={project.code}>
              {project.name}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-[10px] text-text-faint" />
      </label>

      <label className="relative flex h-[34px] min-w-[124px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <CalendarDays size={17} className="shrink-0 text-text-faint" />
        <span className="sr-only">Date range</span>
        <select
          value={String(timeframe)}
          onChange={(event) => updateFilter("timeframe", event.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-[22px] text-[13px] font-medium text-text-main outline-none"
        >
          {timeframes.map((days) => (
            <option key={days} value={days}>
              {days} days
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-[10px] text-text-faint" />
      </label>
    </div>
  );
}
