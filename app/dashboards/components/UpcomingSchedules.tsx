"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, Clock, ChevronRight } from "lucide-react";

interface UpcomingSchedulesProps {
  schedules: any[];
}

export function UpcomingSchedules({ schedules }: UpcomingSchedulesProps) {
  if (!schedules || schedules.length === 0) return null;

  return (
    <div className="bg-surface/90 backdrop-blur-md rounded-2xl border border-indigo-100/50 shadow-sm overflow-hidden flex flex-col mb-6">
      <div className="px-6 py-4 border-b border-indigo-50 flex justify-between items-center bg-surface-hover/50">
        <h2 className="text-sm font-extrabold text-text-main flex items-center">
          <CalendarClock
            className="mr-2 text-indigo-600"
            size={16}
            strokeWidth={2.5}
          />
          Upcoming Scheduled Pipelines
        </h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
          {schedules.length} Active
        </span>
      </div>
      <div className="divide-y divide-border">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors group"
          >
            <div className="flex flex-col">
              <Link
                href={`/projects/${schedule.project.code}/automation`}
                className="font-bold text-text-main hover:text-indigo-600 transition-colors flex items-center text-sm"
              >
                {schedule.title}
                <ChevronRight
                  size={14}
                  className="ml-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </Link>
              <div className="flex items-center mt-2 text-[11px] font-medium text-text-muted">
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-sm mr-2">
                  {schedule.project.code}
                </span>
                <Clock size={12} className="mr-1 text-indigo-400" />
                <span className="text-text-muted font-medium">
                  {(() => {
                    try {
                      return require("cronstrue").toString(schedule.cron);
                    } catch (e) {
                      return `Cron: ${schedule.cron}`;
                    }
                  })()}
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                Active Schedule
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
