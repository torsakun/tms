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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
          <CalendarClock className="mr-2 text-blue-500" size={16} strokeWidth={2.5} />
          Upcoming Scheduled Pipelines
        </h2>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{schedules.length} Active</span>
      </div>
      <div className="divide-y divide-slate-100">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex flex-col">
              <Link href={`/projects/${schedule.project.code}/automation`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center text-sm">
                {schedule.title}
                <ChevronRight size={14} className="ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <div className="flex items-center mt-1 text-[11px] font-medium text-slate-500">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2">{schedule.project.code}</span>
                <Clock size={12} className="mr-1" />
                Cron: <code className="ml-1 text-indigo-600 font-mono bg-indigo-50 px-1 rounded">{schedule.cron}</code>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                Active Schedule
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
