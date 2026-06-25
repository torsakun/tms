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
import { Button } from "@/components/ui/Button";

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
    <section className="flex h-full flex-col overflow-hidden rounded-[13px] border border-border/80 bg-surface shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
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
            <tr className="border-b border-border/80 bg-surface-hover/70 text-xs font-bold text-text-muted">
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
                  className="group border-b border-border/80 transition-colors duration-150 hover:bg-surface-hover/80"
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
                      <span className="inline-flex items-center rounded-md border border-success/25 bg-success-soft px-2.5 py-1 text-xs font-bold text-success-foreground border-success/25 text-success-foreground">
                        <CheckCircle2 size={12} className="mr-1.5" /> Completed
                      </span>
                    )}
                    {run.liveStatus === "MANUAL_ACTIVE" && (
                      <span className="inline-flex items-center rounded-md border border-info/25 bg-info-soft px-2.5 py-1 text-xs font-bold text-info-foreground border-info/25 text-info-foreground">
                        <PlayCircle size={12} className="mr-1.5 text-info" />{" "}
                        Manual
                      </span>
                    )}
                    {run.liveStatus === "RUNNING" && (
                      <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        <Loader2 size={12} className="mr-1.5 animate-spin" />{" "}
                        Running
                      </span>
                    )}
                    {run.liveStatus === "QUEUED" && (
                      <span className="inline-flex items-center rounded-md border border-warning/25 bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning-foreground border-warning/25 text-warning-foreground">
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
                        className="bg-success-soft"
                        title={`Passed: ${run.metrics.passed}`}
                      />
                      <div
                        style={{ width: `${failPercent}%` }}
                        className="bg-danger"
                        title={`Failed: ${run.metrics.failed}`}
                      />
                      <div
                        style={{ width: `${blockPercent}%` }}
                        className="bg-warning-soft"
                        title={`Blocked: ${run.metrics.blocked}`}
                      />
                      <div
                        style={{ width: `${skipPercent}%` }}
                        className="bg-skip"
                        title={`Skipped: ${run.metrics.skipped}`}
                      />
                      <div
                        style={{ width: `${untestedPercent}%` }}
                        className="bg-skip-soft"
                        title={`Untested: ${run.metrics.untested}`}
                      />
                    </div>
                    <div className="mt-1.5 flex gap-2 text-xs font-bold">
                      {run.metrics.passed > 0 && (
                        <span className="rounded bg-success-soft px-1.5 text-success-foreground text-success-foreground">
                          {run.metrics.passed}P
                        </span>
                      )}
                      {run.metrics.failed > 0 && (
                        <span className="rounded bg-danger-soft px-1.5 text-danger-foreground text-danger-foreground">
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
        <div className="mt-auto flex items-center justify-between border-t border-border/80 bg-surface-hover/50 px-5 py-3 rounded-b-2xl">
          <span className="text-xs text-text-muted font-medium">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, enhancedRuns.length)} of{" "}
            {enhancedRuns.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              iconOnly
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-text-muted hover:text-text-main"
              aria-label="Previous execution page"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="secondary"
              iconOnly
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="text-text-muted hover:text-text-main"
              aria-label="Next execution page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
