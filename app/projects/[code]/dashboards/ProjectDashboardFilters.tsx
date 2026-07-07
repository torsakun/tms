"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Activity, CalendarDays, ChevronDown, Flag } from "lucide-react";

type ProjectDashboardFiltersProps = {
  projectCode: string;
  milestones: Array<{ id: string; title: string }>;
  environments: Array<{ id: string; title: string }>;
  selectedMilestone: string;
  selectedEnvironment: string;
  timeframe: number;
};

const timeframes = [7, 14, 30, 60, 90];

export function ProjectDashboardFilters({
  projectCode,
  milestones,
  environments,
  selectedMilestone,
  selectedEnvironment,
  timeframe,
}: ProjectDashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: "milestone" | "environment" | "timeframe", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || (key === "timeframe" && value === "30")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.push(query ? `/projects/${projectCode}/dashboards?${query}` : `/projects/${projectCode}/dashboards`);
  };

  return (
    <div className="flex items-center gap-[8px]">
      <label className="relative flex h-[34px] min-w-[150px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <Flag size={16} className="shrink-0 text-text-faint" />
        <span className="sr-only">Milestone</span>
        <select
          value={selectedMilestone}
          onChange={(event) => updateFilter("milestone", event.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-[22px] text-[13px] font-medium text-text-main outline-none"
        >
          <option value="">All milestones</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-[10px] text-text-faint" />
      </label>

      <label className="relative flex h-[34px] min-w-[132px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <Activity size={16} className="shrink-0 text-text-faint" />
        <span className="sr-only">Environment</span>
        <select
          value={selectedEnvironment}
          onChange={(event) => updateFilter("environment", event.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-[22px] text-[13px] font-medium text-text-main outline-none"
        >
          <option value="">All envs</option>
          {environments.map((environment) => (
            <option key={environment.id} value={environment.id}>
              {environment.title}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-[10px] text-text-faint" />
      </label>

      <label className="relative flex h-[34px] min-w-[124px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-medium shadow-sm transition-[border-color,box-shadow] hover:border-primary/35 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <CalendarDays size={16} className="shrink-0 text-text-faint" />
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
