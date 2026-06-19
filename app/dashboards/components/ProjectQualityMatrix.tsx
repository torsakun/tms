"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Folder,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProjectQualityMatrixProps {
  projects: Array<{
    code: string;
    name: string;
    cases: number;
    automated: number;
    lastRunHealth: number | null;
  }>;
}

export function ProjectQualityMatrix({ projects }: ProjectQualityMatrixProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center text-base font-extrabold text-text-main">
          <Folder
            className="mr-2 text-primary"
            size={18}
            strokeWidth={2.5}
          />
          Project Quality Matrix
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-surface-hover/70 text-xs font-bold text-text-muted">
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3 text-right">Cases</th>
              <th className="px-5 py-3">Automation</th>
              <th className="px-5 py-3">Health</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentProjects.map((p) => (
              <tr
                key={p.code}
                className="border-b border-border transition-colors duration-150 hover:bg-surface-hover/80"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/projects/${p.code}/repository`}
                    className="flex flex-col items-start"
                  >
                    <span className="font-bold text-text-main transition-colors hover:text-primary">
                      {p.name}
                    </span>
                    <span className="mt-1.5 rounded border border-primary/15 bg-primary-light px-1.5 py-0.5 text-xs font-bold text-primary">
                      {p.code}
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold tabular-nums text-text-muted">
                  {p.cases}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="mr-3 h-2 w-full max-w-[96px] overflow-hidden rounded-full border border-border/20 bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${p.automated}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums text-text-muted">
                      {p.automated.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {p.lastRunHealth !== null ? (
                    <div className="flex items-center">
                      {p.lastRunHealth >= 90 ? (
                        <CheckCircle2
                          size={16}
                          className="text-emerald-500 mr-1.5"
                        />
                      ) : p.lastRunHealth >= 70 ? (
                        <AlertCircle
                          size={16}
                          className="text-amber-500 mr-1.5"
                        />
                      ) : (
                        <XCircle size={16} className="text-red-500 mr-1.5" />
                      )}
                      <span className="font-mono font-bold tabular-nums text-text-main">
                        {p.lastRunHealth.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="rounded-md border border-border bg-surface-hover px-2 py-1 text-xs font-bold text-text-muted">
                      No runs
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-text-muted font-medium"
                >
                  No projects found.
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
            {Math.min(startIndex + itemsPerPage, projects.length)} of{" "}
            {projects.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous project page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next project page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
