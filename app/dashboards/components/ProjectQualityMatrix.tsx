"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center">
          <Folder className="mr-2 text-blue-500" size={18} strokeWidth={2.5} />
          Project Quality Matrix
        </h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="px-6 py-3.5">Project</th>
              <th className="px-6 py-3.5 text-right">Cases</th>
              <th className="px-6 py-3.5">Automation</th>
              <th className="px-6 py-3.5">Health</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentProjects.map((p) => (
              <tr key={p.code} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/projects/${p.code}/repository`} className="flex flex-col">
                    <span className="font-bold text-slate-800 hover:text-blue-600 transition-colors">{p.name}</span>
                    <span className="text-[11px] font-bold text-slate-400 mt-0.5">{p.code}</span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-600">{p.cases}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3 max-w-[80px]">
                      <div className="h-full bg-emerald-500" style={{width: `${p.automated}%`}}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{p.automated.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {p.lastRunHealth !== null ? (
                    <div className="flex items-center">
                      {p.lastRunHealth >= 90 ? <CheckCircle2 size={16} className="text-emerald-500 mr-1.5" /> : 
                       p.lastRunHealth >= 70 ? <AlertCircle size={16} className="text-amber-500 mr-1.5" /> : 
                       <XCircle size={16} className="text-red-500 mr-1.5" />}
                      <span className="font-bold text-slate-700">{p.lastRunHealth.toFixed(0)}%</span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">No runs</span>
                  )}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
          <span className="text-xs text-slate-500 font-medium">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, projects.length)} of {projects.length}
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
