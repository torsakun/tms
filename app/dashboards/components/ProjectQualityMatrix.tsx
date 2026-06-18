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
  projects: any[];
}

export function ProjectQualityMatrix({ projects }: ProjectQualityMatrixProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-transparent">
        <h2 className="text-base font-extrabold text-text-main flex items-center">
          <Folder
            className="mr-2 text-indigo-600"
            size={18}
            strokeWidth={2.5}
          />
          Project Quality Matrix
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-extrabold text-text-muted uppercase tracking-wider bg-surface-hover/50">
              <th className="px-6 py-3.5">Project</th>
              <th className="px-6 py-3.5 text-right">Cases</th>
              <th className="px-6 py-3.5">Automation</th>
              <th className="px-6 py-3.5">Health</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentProjects.map((p) => (
              <tr
                key={p.code}
                className="border-b border-border hover:bg-surface-hover/80 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/projects/${p.code}/repository`}
                    className="flex flex-col items-start"
                  >
                    <span className="font-bold text-text-main hover:text-indigo-600 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-sm mt-1.5">
                      {p.code}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-right font-bold text-text-muted">
                  {p.cases}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden mr-3 max-w-[80px]">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${p.automated}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-text-muted">
                      {p.automated.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
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
                      <span className="font-bold text-text-main">
                        {p.lastRunHealth.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-hover border border-border/60 shadow-sm px-2 py-1 rounded-md">
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
        <div className="px-6 py-4 border-t border-indigo-50 flex items-center justify-between bg-surface-hover/50 mt-auto">
          <span className="text-xs text-text-muted font-medium">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, projects.length)} of{" "}
            {projects.length}
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
