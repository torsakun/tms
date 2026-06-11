"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search, LayoutList, Grid, MoreVertical,
  AlertTriangle, Check, Settings, Archive,
  FolderOpen, Plus, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: "year",  secs: 31536000 },
    { label: "month", secs: 2592000  },
    { label: "day",   secs: 86400    },
    { label: "hour",  secs: 3600     },
    { label: "min",   secs: 60       },
  ];
  for (const { label, secs } of intervals) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

interface ProjectData {
  id: string; name: string; code: string;
  testCasesCount: number; suitesCount: number;
  activeRunsCount: number; testRunsCount: number;
  milestonesCount: number; teamMembers: number;
  automationPercent: number; latestRunPassRate: number | null;
  updatedAt: string;
}

// Deterministic vibrant color per project index
const PROJECT_PALETTES = [
  { bg: "#f97316", light: "#fff7ed", border: "#f97316" }, // orange
  { bg: "#10b981", light: "#f0fdf4", border: "#10b981" }, // emerald
  { bg: "#6366f1", light: "#eef2ff", border: "#6366f1" }, // indigo
  { bg: "#8b5cf6", light: "#f5f3ff", border: "#8b5cf6" }, // violet
  { bg: "#f43f5e", light: "#fff1f2", border: "#f43f5e" }, // rose
  { bg: "#0ea5e9", light: "#f0f9ff", border: "#0ea5e9" }, // sky
];

function HealthBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-slate-300 font-medium">—</span>;
  const good = rate >= 90, warn = rate >= 70;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
      ${good ? "bg-emerald-50 text-emerald-700" : warn ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
      {good ? <Check size={11} strokeWidth={3} /> : warn ? <AlertTriangle size={11} /> : <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />}
      {rate.toFixed(0)}%
    </span>
  );
}

function AutomationBar({ percent }: { percent: number }) {
  const color = percent >= 70 ? "#10b981" : percent >= 30 ? "#f59e0b" : "#e2e8f0";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-8 text-right shrink-0">{percent.toFixed(0)}%</span>
    </div>
  );
}

export function ProjectList({ initialProjects }: { initialProjects: ProjectData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = initialProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Projects</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {initialProjects.length}
          </span>
        </div>
        <Link href="?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all active:translate-y-0"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
          <Plus size={15} strokeWidth={2.5} />
          New project
        </Link>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              aria-label="Search projects"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 h-8 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 w-52 transition-all"
            />
          </div>
          <button className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:border-slate-300 transition-all">
            Status: Active <ChevronDown size={12} />
          </button>
          <button className="h-8 px-3 text-indigo-500 text-xs font-semibold hover:bg-indigo-50 rounded-lg transition-all">
            + Filter
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-lg">
          <button className="p-1.5 bg-white rounded-md shadow-sm text-indigo-600">
            <LayoutList size={14} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors">
            <Grid size={14} />
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="pl-4 pr-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">Health</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">Automation</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-44">Runs</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Team</th>
              <th className="pr-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((project, idx) => {
              const pal = PROJECT_PALETTES[idx % PROJECT_PALETTES.length];
              const isOpen = activeDropdown === project.id;

              return (
                <tr key={project.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors group">

                  {/* PROJECT — left accent border via pseudo box-shadow trick on first td */}
                  <td className="pl-0 pr-5 py-4 align-middle" style={{ borderLeft: `3px solid ${pal.border}` }}>
                    <Link href={`/projects/${project.code}/repository`}
                      className="flex items-center gap-3 pl-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ background: pal.bg }}>
                        {project.code.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400">{project.testCasesCount} cases</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[11px] text-slate-400">{project.suitesCount} suites</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[11px] text-slate-400">{timeAgo(project.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* HEALTH */}
                  <td className="px-5 py-4 align-middle">
                    <HealthBadge rate={project.latestRunPassRate} />
                  </td>

                  {/* AUTOMATION */}
                  <td className="px-5 py-4 align-middle">
                    <AutomationBar percent={project.automationPercent} />
                  </td>

                  {/* RUNS */}
                  <td className="px-5 py-4 align-middle">
                    {project.testRunsCount > 0 ? (
                      <Link href={`/projects/${project.code}/runs`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {project.activeRunsCount} active
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500 font-normal">{project.testRunsCount} total</span>
                      </Link>
                    ) : (
                      <span className="text-slate-300 font-medium">—</span>
                    )}
                  </td>

                  {/* TEAM */}
                  <td className="px-5 py-4 align-middle">
                    {project.teamMembers > 0 ? (
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(project.teamMembers, 3) }).map((_, i) => (
                          <div key={i}
                            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ background: PROJECT_PALETTES[i % PROJECT_PALETTES.length].bg }}>
                            U{i + 1}
                          </div>
                        ))}
                        {project.teamMembers > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            +{project.teamMembers - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-medium">—</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="pr-4 py-4 align-middle text-right">
                    <div className="relative inline-block" ref={isOpen ? dropdownRef : null}>
                      <button
                        onClick={() => setActiveDropdown(isOpen ? null : project.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                          ${isOpen ? "bg-slate-100 text-slate-700" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"}`}>
                        <MoreVertical size={15} />
                      </button>

                      {isOpen && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl py-1 z-30 overflow-hidden"
                          style={{ border: "1px solid #f1f3f9", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                          <Link href={`/projects/${project.code}/dashboards`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <LayoutList size={13} className="text-slate-400" /> View Dashboard
                          </Link>
                          <Link href={`/projects/${project.code}/settings`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <Settings size={13} className="text-slate-400" /> Settings
                          </Link>
                          <div className="h-px bg-slate-100 my-1" />
                          <button
                            onClick={() => toast("Archive coming soon", { icon: "🚧" })}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                            <Archive size={13} className="text-amber-400" /> Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <FolderOpen size={32} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400 mb-3">No projects found</p>
                  <Link href="?create=true"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    <Plus size={14} /> Create a project
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
