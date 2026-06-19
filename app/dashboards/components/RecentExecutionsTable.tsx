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
  recentRuns: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    project: { name: string; code: string };
    metrics: {
      total: number;
      passed: number;
      failed: number;
      blocked: number;
      skipped: number;
      untested: number;
    };
  }>;
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

        if (!isCompleted && !isAutomatedAction) {
          liveStatus = "MANUAL_ACTIVE";
        } else if (isRunning) {
          liveStatus = "RUNNING";
        } else if (isQueued) {
          liveStatus = "QUEUED";
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
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center text-base font-extrabold text-text-main">
          <Activity
            className="mr-2 text-primary"
            size={18}
            strokeWidth={2.5}
          />
          Live Execution Center
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-surface-hover/70 text-xs font-bold text-text-muted">
              <th className="px-5 py-3">Run</th>
              <th className="px-5 py-3 w-32">Status</th>
              <th className="px-5 py-3">Progress</th>
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
                  className="group border-b border-border transition-colors duration-150 hover:bg-surface-hover/80"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/projects/${run.project.code}/runs/${run.id}`}
                      className="flex flex-col"
                    >
                      <span className="flex items-center font-bold text-text-main transition-colors hover:text-primary">
                        {run.title}
                        <ChevronRight
                          size={14}
                          className="ml-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </span>
                      <div className="mt-2 flex items-center">
                        <span className="rounded border border-primary/15 bg-primary-light px-1.5 py-0.5 text-xs font-bold text-primary">
                          {run.project.code}-{run.id.split("-")[0]}
                        </span>
                        <span className="mx-2 text-border">•</span>
                        <span className="flex items-center text-xs font-medium text-text-muted">
                          <Clock size={12} className="mr-1 text-text-muted" />
                          {formatThaiTime(run.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {run.liveStatus === "COMPLETED" && (
                      <span className="inline-flex items-center rounded-md border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <CheckCircle2 size={12} className="mr-1.5" /> Completed
                      </span>
                    )}
                    {run.liveStatus === "MANUAL_ACTIVE" && (
                      <span className="inline-flex items-center rounded-md border border-sky-200/60 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                        <PlayCircle size={12} className="mr-1.5 text-sky-500" />{" "}
                        Manual
                      </span>
                    )}
                    {run.liveStatus === "RUNNING" && (
                      <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                        <Loader2 size={12} className="mr-1.5 animate-spin" />{" "}
                        Running
                      </span>
                    )}
                    {run.liveStatus === "QUEUED" && (
                      <span className="inline-flex items-center rounded-md border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        <Clock size={12} className="mr-1.5" /> Queued
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`mb-1.5 flex h-2 w-full overflow-hidden rounded-full border border-border/25 bg-surface-hover ${run.liveStatus === "RUNNING" ? "opacity-100" : "opacity-80"}`}
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
                    <div className="mt-1.5 flex gap-2 text-xs font-bold">
                      {run.metrics.passed > 0 && (
                        <span className="rounded bg-emerald-50 px-1.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {run.metrics.passed}P
                        </span>
                      )}
                      {run.metrics.failed > 0 && (
                        <span className="rounded bg-red-50 px-1.5 text-red-700 dark:bg-red-500/10 dark:text-red-300">
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
        <div className="mt-auto flex items-center justify-between border-t border-border bg-surface-hover/50 px-5 py-3">
          <span className="text-xs text-text-muted font-medium">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, enhancedRuns.length)} of{" "}
            {enhancedRuns.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous execution page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next execution page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
