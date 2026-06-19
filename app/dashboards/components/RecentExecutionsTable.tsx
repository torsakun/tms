"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Clock,
  Activity,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatThaiTime } from "@/lib/utils";

interface RecentExecutionsTableProps {
  recentRuns: any[];
}

export function RecentExecutionsTable({
  recentRuns,
}: RecentExecutionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const enhancedRuns = useMemo(() => {
    return recentRuns
      .map((run) => {
        const isAutomatedAction =
          run.title?.startsWith("Scheduled Run:") ||
          run.title?.startsWith("Trigger Run:");
        const isCompleted =
          run.status === "COMPLETED" ||
          (run.metrics.total > 0 && run.metrics.untested === 0);
        const isQueued =
          isAutomatedAction &&
          run.status === "ACTIVE" &&
          run.metrics.total > 0 &&
          run.metrics.untested === run.metrics.total;
        const isRunning =
          isAutomatedAction &&
          run.status === "ACTIVE" &&
          !isQueued &&
          !isCompleted;

        let liveStatus = "COMPLETED";
        let sortPriority = 4;

        if (!isCompleted && !isAutomatedAction) {
          liveStatus = "MANUAL_ACTIVE";
          sortPriority = 3;
        } else if (isRunning) {
          liveStatus = "RUNNING";
          sortPriority = 1;
        } else if (isQueued) {
          liveStatus = "QUEUED";
          sortPriority = 2;
        }

        return { ...run, liveStatus, isCompleted };
      })
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [recentRuns]);

  const totalPages = Math.ceil(enhancedRuns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRuns = enhancedRuns.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-transparent">
        <h2 className="text-base font-extrabold text-text-main flex items-center">
          <Activity
            className="mr-2 text-indigo-600"
            size={18}
            strokeWidth={2.5}
          />
          Live Execution Center
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border text-[10px] font-black text-text-muted uppercase tracking-widest bg-slate-50/75 dark:bg-slate-900/45 backdrop-blur-xs">
              <th className="px-6 py-4">Run</th>
              <th className="px-6 py-4 w-28">Status</th>
              <th className="px-6 py-4">Progress</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentRuns.map((run) => {
              const passPercent =
                run.metrics.total > 0
                  ? (run.metrics.passed / run.metrics.total) * 100
                  : 0;
              const failPercent =
                run.metrics.total > 0
                  ? (run.metrics.failed / run.metrics.total) * 100
                  : 0;
              const blockPercent =
                run.metrics.total > 0
                  ? (run.metrics.blocked / run.metrics.total) * 100
                  : 0;
              const skipPercent =
                run.metrics.total > 0
                  ? (run.metrics.skipped / run.metrics.total) * 100
                  : 0;
              const untestedPercent =
                run.metrics.total > 0
                  ? (run.metrics.untested / run.metrics.total) * 100
                  : 0;

              return (
                <tr
                  key={run.id}
                  className="border-b border-border hover:bg-surface-hover/80 transition-all duration-200 group"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/projects/${run.project.code}/runs/${run.id}`}
                      className="flex flex-col"
                    >
                      <span className="font-bold text-text-main hover:text-indigo-600 transition-colors flex items-center">
                        {run.title}
                        <ChevronRight
                          size={14}
                          className="ml-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </span>
                      <div className="flex items-center mt-2">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-xs">
                          {run.project.code}-{run.id.split("-")[0]}
                        </span>
                        <span className="mx-2 text-indigo-200">•</span>
                        <span className="text-[11px] font-medium text-text-muted flex items-center">
                          <Clock size={11} className="mr-1 text-indigo-400" />
                          {formatThaiTime(run.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {run.liveStatus === "COMPLETED" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 size={12} className="mr-1.5" /> Completed
                      </span>
                    )}
                    {run.liveStatus === "MANUAL_ACTIVE" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/60 shadow-sm">
                        <PlayCircle size={12} className="mr-1.5 text-sky-500" />{" "}
                        Active (Manual)
                      </span>
                    )}
                    {run.liveStatus === "RUNNING" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Loader2 size={12} className="mr-1.5 animate-spin" />{" "}
                        Running
                      </span>
                    )}
                    {run.liveStatus === "QUEUED" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse">
                        <Clock size={12} className="mr-1.5" /> In Queue
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`w-full h-2 bg-slate-100 dark:bg-slate-800/60 rounded-full flex overflow-hidden mb-1.5 border border-border/25 ${run.liveStatus === "RUNNING" ? "opacity-100" : "opacity-80"}`}
                    >
                      <div
                        style={{ width: `${passPercent}%` }}
                        className="bg-emerald-500"
                        title={`Passed: ${run.metrics.passed}`}
                      />
                      <div
                        style={{ width: `${failPercent}%` }}
                        className="bg-red-500"
                        title={`Failed: ${run.metrics.failed}`}
                      />
                      <div
                        style={{ width: `${blockPercent}%` }}
                        className="bg-amber-500"
                        title={`Blocked: ${run.metrics.blocked}`}
                      />
                      <div
                        style={{ width: `${skipPercent}%` }}
                        className="bg-slate-400"
                        title={`Skipped: ${run.metrics.skipped}`}
                      />
                      <div
                        style={{ width: `${untestedPercent}%` }}
                        className="bg-slate-200/60"
                        title={`Untested: ${run.metrics.untested}`}
                      />
                    </div>
                    <div className="flex space-x-2 text-[11px] font-bold mt-1.5">
                      {run.metrics.passed > 0 && (
                        <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded">
                          {run.metrics.passed}P
                        </span>
                      )}
                      {run.metrics.failed > 0 && (
                        <span className="text-red-600 bg-red-50 px-1.5 rounded">
                          {run.metrics.failed}F
                        </span>
                      )}
                      {run.metrics.untested > 0 && (
                        <span className="text-text-muted bg-surface-hover px-1.5 rounded">
                          {run.metrics.untested}U
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {currentRuns.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-text-muted font-medium"
                >
                  No recent test runs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-indigo-50 flex items-center justify-between bg-surface-hover/50 mt-auto">
          <span className="text-xs text-text-muted font-medium">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, enhancedRuns.length)} of{" "}
            {enhancedRuns.length}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-border text-text-muted hover:bg-surface-hover hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-border text-text-muted hover:bg-surface-hover hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
