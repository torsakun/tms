"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PlayCircle, ChevronRight, ChevronLeft, Clock, Activity, Loader2, CheckCircle2 } from "lucide-react";

interface RecentExecutionsTableProps {
  recentRuns: any[];
}

export function RecentExecutionsTable({ recentRuns }: RecentExecutionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Enhance runs with derived status and sort them: Running/Queued first, then Completed
  const enhancedRuns = useMemo(() => {
    return recentRuns.map(run => {
      const isCompleted = run.status === 'COMPLETED' || (run.metrics.total > 0 && run.metrics.untested === 0);
      const isQueued = run.status === 'ACTIVE' && run.metrics.total > 0 && run.metrics.untested === run.metrics.total;
      const isRunning = run.status === 'ACTIVE' && !isQueued && !isCompleted;
      
      let liveStatus = 'COMPLETED';
      let sortPriority = 3;
      
      if (isRunning) {
        liveStatus = 'RUNNING';
        sortPriority = 1;
      } else if (isQueued) {
        liveStatus = 'QUEUED';
        sortPriority = 2;
      }

      return { ...run, liveStatus, sortPriority, isCompleted };
    }).sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [recentRuns]);

  const totalPages = Math.ceil(enhancedRuns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRuns = enhancedRuns.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center">
          <Activity className="mr-2 text-indigo-500" size={18} strokeWidth={2.5} />
          Live Execution Center
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="px-6 py-3.5">Run</th>
              <th className="px-6 py-3.5 w-28">Status</th>
              <th className="px-6 py-3.5">Progress</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentRuns.map((run) => {
              const passPercent = run.metrics.total > 0 ? (run.metrics.passed / run.metrics.total) * 100 : 0;
              const failPercent = run.metrics.total > 0 ? (run.metrics.failed / run.metrics.total) * 100 : 0;
              const blockPercent = run.metrics.total > 0 ? (run.metrics.blocked / run.metrics.total) * 100 : 0;
              const skipPercent = run.metrics.total > 0 ? (run.metrics.skipped / run.metrics.total) * 100 : 0;
              const untestedPercent = run.metrics.total > 0 ? (run.metrics.untested / run.metrics.total) * 100 : 0;

              return (
                <tr key={run.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/projects/${run.project.code}/runs/${run.id}`} className="flex flex-col">
                      <span className="font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center">
                        {run.title}
                        <ChevronRight size={14} className="ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <div className="flex items-center mt-1">
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{run.project.code}-{run.id.split('-')[0]}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center">
                          <Clock size={10} className="mr-1 opacity-70" />
                          {new Date(run.createdAt).toLocaleString('en-GB', { 
                            day: 'numeric', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                     {run.liveStatus === 'COMPLETED' && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                         <CheckCircle2 size={12} className="mr-1.5" /> Completed
                       </span>
                     )}
                     {run.liveStatus === 'RUNNING' && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                         <Loader2 size={12} className="mr-1.5 animate-spin" /> Running
                       </span>
                     )}
                     {run.liveStatus === 'QUEUED' && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse">
                         <Clock size={12} className="mr-1.5" /> In Queue
                       </span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden mb-1.5 ${run.liveStatus === 'RUNNING' ? 'opacity-100' : 'opacity-80'}`}>
                      <div style={{ width: `${passPercent}%` }} className="bg-emerald-500" title={`Passed: ${run.metrics.passed}`} />
                      <div style={{ width: `${failPercent}%` }} className="bg-red-500" title={`Failed: ${run.metrics.failed}`} />
                      <div style={{ width: `${blockPercent}%` }} className="bg-amber-500" title={`Blocked: ${run.metrics.blocked}`} />
                      <div style={{ width: `${skipPercent}%` }} className="bg-slate-400" title={`Skipped: ${run.metrics.skipped}`} />
                      <div style={{ width: `${untestedPercent}%` }} className="bg-slate-200" title={`Untested: ${run.metrics.untested}`} />
                    </div>
                    <div className="flex space-x-2 text-[11px] font-bold">
                      {run.metrics.passed > 0 && <span className="text-emerald-600">{run.metrics.passed}P</span>}
                      {run.metrics.failed > 0 && <span className="text-red-600">{run.metrics.failed}F</span>}
                      {run.metrics.untested > 0 && <span className="text-slate-400">{run.metrics.untested}U</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {currentRuns.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium">No recent test runs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
          <span className="text-xs text-slate-500 font-medium">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, enhancedRuns.length)} of {enhancedRuns.length}
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
