"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, Clock, ChevronRight } from "lucide-react";
import cronstrue from "cronstrue";

interface UpcomingSchedulesProps {
  schedules: Array<{
    id: string;
    title: string;
    cron: string;
    project: { name: string; code: string };
  }>;
}

export function UpcomingSchedules({ schedules }: UpcomingSchedulesProps) {
  if (!schedules || schedules.length === 0) return null;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center text-base font-extrabold text-text-main">
          <CalendarClock
            className="mr-2 text-primary"
            size={18}
            strokeWidth={2.5}
          />
          Scheduled Pipelines
        </h2>
        <span className="rounded-md border border-primary/15 bg-primary-light px-2 py-1 text-xs font-bold text-primary">
          {schedules.length} Active
        </span>
      </div>
      <div className="divide-y divide-border">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="flex min-w-0 flex-col">
              <Link
                href={`/projects/${schedule.project.code}/automation`}
                className="flex items-center text-sm font-bold text-text-main transition-colors hover:text-primary"
              >
                {schedule.title}
                <ChevronRight
                  size={14}
                  className="ml-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </Link>
              <div className="mt-2 flex items-center text-xs font-medium text-text-muted">
                <span className="mr-2 rounded border border-primary/15 bg-primary-light px-1.5 py-0.5 text-xs font-bold text-primary">
                  {schedule.project.code}
                </span>
                <Clock size={12} className="mr-1 text-text-muted" />
                <span className="text-text-muted font-medium">
                  {(() => {
                    try {
                      return cronstrue.toString(schedule.cron);
                    } catch {
                      return `Cron: ${schedule.cron}`;
                    }
                  })()}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end text-right">
              <span className="mb-1.5 text-xs font-semibold text-text-muted">
                Status
              </span>
              <span className="inline-flex items-center rounded-md border border-emerald-200/50 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
