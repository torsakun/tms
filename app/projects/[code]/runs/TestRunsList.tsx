"use client";
// Force rebuild for TestRunsList

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MoreVertical, 
  Clock, 
  Search, 
  Filter, 
  Play, 
  Trash2,
  FileText,
  Edit
} from "lucide-react";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

const AVATAR_COLORS = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#e11d48", "#0284c7", "#9333ea"];
function authorMeta(author: { name?: string | null; email?: string | null } | null | undefined) {
  const display = author?.name || author?.email?.split("@")[0] || "Unknown";
  const parts = display.split(" ");
  const initials = (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : display.substring(0, 2)).toUpperCase();
  let sum = 0;
  for (let i = 0; i < display.length; i++) sum += display.charCodeAt(i);
  return { display, initials, color: AVATAR_COLORS[sum % AVATAR_COLORS.length] };
}

function formatDuration(ms: number) {
  if (ms === 0) return "0s";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

interface TestRunsListProps {
  initialRuns: any[];
  code: string;
}

export function TestRunsList({ initialRuns, code }: TestRunsListProps) {
  const router = useRouter();
  const { role } = useProjectRole();
  const [runs, setRuns] = useState(initialRuns);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (runId: string) => {
    if (!window.confirm("Are you sure you want to delete this test run? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/runs/${runId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setRuns(prev => prev.filter(r => r.id !== runId));
        setActiveDropdown(null);
        router.refresh();
      } else {
        alert("Failed to delete test run.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the test run.");
    }
  };

  const filteredRuns = runs.filter(run => {
    const matchesSearch = run.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / rowsPerPage));
  const paginatedRuns = filteredRuns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        {role !== 'VIEWER' && (
          <Link
            href={`/projects/${code}/runs/create`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            Start new test run
          </Link>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search test runs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-4 h-8 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 w-52 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center h-8 text-xs px-3 rounded-lg border transition-colors font-semibold ${showFilters || statusFilter !== 'ALL' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter size={13} className="mr-1.5" />
            {statusFilter === "ALL" ? "All Statuses" : statusFilter}
          </button>

          {showFilters && (
            <div className="absolute top-full mt-1 left-0 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
              {["ALL","ACTIVE","COMPLETED","ABORTED"].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${statusFilter === s ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>
                  {s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No test runs found</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6 text-sm">
            {role !== 'VIEWER' ? "Create a new test run to start executing tests and tracking quality." : "There are currently no test runs for this project."}
          </p>
          {role !== 'VIEWER' && (
            <Link
              href={`/projects/${code}/runs/create`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              Start test run
            </Link>
          )}
        </div>
      ) : (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Status</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-40">Author</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32">Environment</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Total Time</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Elapsed</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-64">Stats</th>
                <th className="py-3 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRuns.map((run) => {
                const passed = run.results.filter((r: any) => r.status === "PASSED").length;
                const failed = run.results.filter((r: any) => r.status === "FAILED").length;
                const blocked = run.results.filter((r: any) => r.status === "BLOCKED").length;
                const skipped = run.results.filter((r: any) => r.status === "SKIPPED").length;
                const untested = run.results.filter((r: any) => r.status === "IN_PROGRESS").length;
                const total = run.results.length;
                
                const passedPercent = total > 0 ? (passed / total) * 100 : 0;
                const failedPercent = total > 0 ? (failed / total) * 100 : 0;
                const blockedPercent = total > 0 ? (blocked / total) * 100 : 0;
                const skippedPercent = total > 0 ? (skipped / total) * 100 : 0;
                const untestedPercent = total > 0 ? (untested / total) * 100 : 0;
                
                const completed = passed + failed + blocked + skipped;
                const completionPercent = total > 0 ? (completed / total) * 100 : 0;

                let statusLabel = "Empty";
                let statusColor = "bg-slate-100 text-slate-500 border-slate-200";

                if (total > 0) {
                  if (run.status === "COMPLETED") {
                    statusLabel = "Completed";
                    statusColor = "bg-slate-100 text-slate-600 border-slate-200";
                  } else if (run.status === "ABORTED") {
                    statusLabel = "Aborted";
                    statusColor = "bg-red-50 text-red-600 border-red-200";
                  } else if (failed > 0) {
                    statusLabel = "Failed";
                    statusColor = "bg-red-50 text-red-600 border-red-200";
                  } else if (passed === total) {
                    statusLabel = "Passed";
                    statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else {
                    statusLabel = "In Progress";
                    statusColor = "bg-indigo-50 text-indigo-600 border-indigo-200";
                  }
                }

                const start = new Date(run.createdAt);
                const end = run.status === 'ACTIVE' ? new Date() : new Date(run.updatedAt);
                let elapsedMs = end.getTime() - start.getTime();
                if (elapsedMs < 0) elapsedMs = 0;

                const totalTimeMs = run.results.reduce((acc: number, result: any) => acc + (result.timeSpent || 0), 0);

                return (
                  <tr key={run.id} className="group hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 align-middle">
                      <Link href={`/projects/${code}/runs/${run.id}`} className="block">
                        <div className="font-semibold text-slate-800 text-[14px] group-hover:text-indigo-600 transition-colors mb-0.5">
                          {run.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Started {timeAgo(run.createdAt)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      {(() => {
                        const a = authorMeta(run.author);
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ background: a.color }}>
                              {a.initials}
                            </div>
                            <span className="text-sm text-slate-600">{a.display}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <span className="text-sm text-slate-500">{run.environment?.title || "—"}</span>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock size={13} className="mr-1.5 text-slate-400" />
                        {formatDuration(totalTimeMs)}
                      </div>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock size={13} className="mr-1.5 text-slate-400" />
                        {formatDuration(elapsedMs)}
                      </div>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <div className="flex h-6 w-full rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                        {passed > 0 && (
                          <div style={{ width: `${passedPercent}%` }} className="group/tt relative bg-[#00875a] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {passed}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Passed
                              </div>
                            </div>
                          </div>
                        )}
                        {failed > 0 && (
                          <div style={{ width: `${failedPercent}%` }} className="group/tt relative bg-[#de350b] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {failed}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Failed
                              </div>
                            </div>
                          </div>
                        )}
                        {blocked > 0 && (
                          <div style={{ width: `${blockedPercent}%` }} className="group/tt relative bg-[#ff991f] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {blocked}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Blocked
                              </div>
                            </div>
                          </div>
                        )}
                        {skipped > 0 && (
                          <div style={{ width: `${skippedPercent}%` }} className="group/tt relative bg-[#0052cc] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {skipped}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Skipped
                              </div>
                            </div>
                          </div>
                        )}
                        {untested > 0 && (
                          <div style={{ width: `${untestedPercent}%` }} className="group/tt relative bg-[#5e6c84] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {untested}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-white border border-slate-200 shadow-sm text-slate-700 text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                In Progress
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-3 align-middle text-right">
                      <div className="relative inline-block text-left" ref={activeDropdown === run.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === run.id ? null : run.id)}
                          className={`p-1.5 rounded transition-colors ${activeDropdown === run.id ? 'bg-surface-hover text-text-main' : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}`}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeDropdown === run.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                            <Link
                              href={`/projects/${code}/runs/${run.id}`}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
                            >
                              <Play size={13} className="mr-2 text-slate-400" /> Open run
                            </Link>
                            <Link
                              href={`/projects/${code}/runs/${run.id}/edit`}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
                            >
                              <Edit size={13} className="mr-2 text-slate-400" /> Edit run
                            </Link>
                            <button
                              onClick={() => handleDelete(run.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center transition-colors"
                            >
                              <Trash2 size={13} className="mr-2" /> Delete run
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRuns.length > 0 && (
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 text-sm text-slate-600 space-x-6 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Rows per page:</span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-8 py-1.5 text-sm outline-none focus:border-indigo-400 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary shadow-sm text-primary-foreground rounded-md font-medium text-sm">
                  {currentPage}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
