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
    <div className="w-full flex flex-col h-full bg-background p-8 pt-0 transition-colors">
      <div className="flex items-center space-x-4 mb-6 pt-4">
        {role !== 'VIEWER' && (
          <Link
            href={`/projects/${code}/runs/create`}
            className="bg-primary text-white shadow-[0_0_10px_rgba(93,135,255,0.4)] px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start new test run
          </Link>
        )}
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
          <input 
            type="text"
            placeholder="Search test runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border-none bg-surface text-text-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center text-sm px-4 py-2 rounded-md transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${showFilters || statusFilter !== 'ALL' ? 'bg-primary/10 text-primary font-medium' : 'bg-surface text-text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Filter size={14} className="mr-2" />
            {statusFilter === "ALL" ? "All Statuses" : statusFilter}
          </button>
          
          {showFilters && (
            <div className="absolute top-full mt-2 left-0 w-48 bg-surface border-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-20 py-2 overflow-hidden">
              <button onClick={() => { setStatusFilter("ALL"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${statusFilter === "ALL" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}>All Statuses</button>
              <button onClick={() => { setStatusFilter("ACTIVE"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${statusFilter === "ACTIVE" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}>Active</button>
              <button onClick={() => { setStatusFilter("COMPLETED"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${statusFilter === "COMPLETED" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}>Completed</button>
              <button onClick={() => { setStatusFilter("ABORTED"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${statusFilter === "ABORTED" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}>Aborted</button>
            </div>
          )}
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">No test runs found</h3>
          <p className="text-text-muted text-center max-w-sm mb-6 text-sm">
            {role !== 'VIEWER' ? "Create a new test run to start executing tests and tracking quality." : "There are currently no test runs for this project."}
          </p>
          {role !== 'VIEWER' && (
            <Link
              href={`/projects/${code}/runs/create`}
              className="px-5 py-2.5 bg-primary text-white shadow-[0_0_10px_rgba(93,135,255,0.4)] rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Start test run
            </Link>
          )}
        </div>
      ) : (
        <div className="w-full bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none overflow-visible transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-surface-hover">
                <th className="py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">TITLE</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-28">STATUS</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-40">AUTHOR</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-32">ENVIRONMENT</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-32">TOTAL TIME</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-32">ELAPSED TIME</th>
                <th className="py-4 px-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-64">TEST RUN STATS</th>
                <th className="py-4 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
                let statusColor = "bg-background text-text-muted border-border";

                if (total > 0) {
                  if (run.status === "COMPLETED") {
                    statusLabel = "Completed";
                    statusColor = "bg-background text-text-main border-border";
                  } else if (run.status === "ABORTED") {
                    statusLabel = "Aborted";
                    statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
                  } else if (failed > 0) {
                    statusLabel = "Failed";
                    statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
                  } else if (passed === total) {
                    statusLabel = "Passed";
                    statusColor = "bg-[#00875a]/10 text-[#00875a] border-[#00875a]/20";
                  } else {
                    statusLabel = "In Progress";
                    statusColor = "bg-[#6554c0]/10 text-[#6554c0] border-[#6554c0]/20";
                  }
                }

                const start = new Date(run.createdAt);
                const end = run.status === 'ACTIVE' ? new Date() : new Date(run.updatedAt);
                let elapsedMs = end.getTime() - start.getTime();
                if (elapsedMs < 0) elapsedMs = 0;

                const totalTimeMs = run.results.reduce((acc: number, result: any) => acc + (result.timeSpent || 0), 0);

                return (
                  <tr key={run.id} className="group hover:bg-surface-hover transition-colors">
                    <td className="py-5 px-6 align-middle">
                      <Link href={`/projects/${code}/runs/${run.id}`} className="block">
                        <div className="font-semibold text-text-main text-[15px] group-hover:text-primary transition-colors mb-1">
                          {run.title}
                        </div>
                        <div className="text-xs text-text-muted">
                          Started {timeAgo(run.createdAt)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-[#b87c88] text-white flex items-center justify-center text-[10px] font-bold">
                          SA
                        </div>
                        <span className="text-sm font-medium text-text-main">System Admin</span>
                      </div>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <span className="text-sm text-text-muted">Integration</span>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <div className="flex items-center text-sm font-medium text-text-muted">
                        <Clock size={14} className="mr-1.5 opacity-70" />
                        {formatDuration(totalTimeMs)}
                      </div>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <div className="flex items-center text-sm font-medium text-text-muted">
                        <Clock size={14} className="mr-1.5 opacity-70" />
                        {formatDuration(elapsedMs)}
                      </div>
                    </td>
                    <td className="py-5 px-3 align-middle">
                      <div className="flex h-6 w-full rounded-md bg-background overflow-hidden border border-border/50">
                        {passed > 0 && (
                          <div style={{ width: `${passedPercent}%` }} className="group/tt relative bg-[#00875a] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {passed}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-surface border border-border shadow-sm text-text-main text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Passed
                              </div>
                            </div>
                          </div>
                        )}
                        {failed > 0 && (
                          <div style={{ width: `${failedPercent}%` }} className="group/tt relative bg-[#de350b] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {failed}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-surface border border-border shadow-sm text-text-main text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Failed
                              </div>
                            </div>
                          </div>
                        )}
                        {blocked > 0 && (
                          <div style={{ width: `${blockedPercent}%` }} className="group/tt relative bg-[#ff991f] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {blocked}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-surface border border-border shadow-sm text-text-main text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Blocked
                              </div>
                            </div>
                          </div>
                        )}
                        {skipped > 0 && (
                          <div style={{ width: `${skippedPercent}%` }} className="group/tt relative bg-[#0052cc] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {skipped}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-surface border border-border shadow-sm text-text-main text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
                                Skipped
                              </div>
                            </div>
                          </div>
                        )}
                        {untested > 0 && (
                          <div style={{ width: `${untestedPercent}%` }} className="group/tt relative bg-[#5e6c84] flex items-center justify-center text-xs text-white font-medium min-w-[24px]">
                            {untested}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tt:block z-50">
                              <div className="bg-surface border border-border shadow-sm text-text-main text-sm py-1 px-3 rounded-md whitespace-nowrap font-normal">
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
                          <div className="absolute right-0 mt-1 w-40 bg-surface border-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-30 py-1 overflow-hidden">
                            <Link 
                              href={`/projects/${code}/runs/${run.id}`}
                              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
                            >
                              <Play size={14} className="mr-2 text-text-muted" /> Open run
                            </Link>
                            <Link 
                              href={`/projects/${code}/runs/${run.id}/edit`}
                              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
                            >
                              <Edit size={14} className="mr-2 text-text-muted" /> Edit run
                            </Link>
                            <button 
                              onClick={() => handleDelete(run.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center transition-colors"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete run
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
            <div className="flex items-center justify-end px-6 py-4 border-t border-border/50 text-sm text-text-main space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-text-muted">Rows per page:</span>
                <div className="relative">
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none bg-transparent border border-border rounded-md pl-3 pr-8 py-1.5 text-sm outline-none focus:border-primary cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
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
                <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary shadow-[0_0_10px_rgba(93,135,255,0.3)] text-white rounded-md font-medium text-sm">
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
