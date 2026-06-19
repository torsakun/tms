"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutList,
  Grid,
  MoreVertical,
  AlertTriangle,
  Check,
  Settings,
  Archive,
  FolderOpen,
  Plus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "min", secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  testCasesCount: number;
  suitesCount: number;
  activeRunsCount: number;
  testRunsCount: number;
  milestonesCount: number;
  teamMembers: number;
  automationPercent: number;
  latestRunPassRate: number | null;
  isArchived: boolean;
  updatedAt: string;
}

// Deterministic vibrant color per project index
const PROJECT_PALETTES = [
  { bg: "#f97316", light: "#fff7ed", border: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fdba74 100%)", shadow: "rgba(249,115,22,0.25)" }, // orange
  { bg: "#10b981", light: "#f0fdf4", border: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)", shadow: "rgba(16,185,129,0.25)" }, // emerald
  { bg: "#6366f1", light: "#eef2ff", border: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)", shadow: "rgba(99,102,241,0.25)" }, // indigo
  { bg: "#8b5cf6", light: "#f5f3ff", border: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)", shadow: "rgba(139,92,246,0.25)" }, // violet
  { bg: "#f43f5e", light: "#fff1f2", border: "#f43f5e", gradient: "linear-gradient(135deg, #f43f5e 0%, #fda4af 100%)", shadow: "rgba(244,63,94,0.25)" }, // rose
  { bg: "#0ea5e9", light: "#f0f9ff", border: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 100%)", shadow: "rgba(14,165,233,0.25)" }, // sky
];

function HealthBadge({ rate }: { rate: number | null }) {
  if (rate === null)
    return <span className="text-slate-300 font-bold text-xs">—</span>;
  const good = rate >= 90,
    warn = rate >= 70;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border
      ${good ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : warn ? "bg-amber-50 text-amber-700 border-amber-200/50" : "bg-red-50 text-red-600 border-red-200/50"}`}
    >
      {good ? (
        <Check size={11} strokeWidth={3.5} />
      ) : warn ? (
        <AlertTriangle size={11} />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
      )}
      {rate.toFixed(0)}%
    </span>
  );
}

function AutomationBar({ percent }: { percent: number }) {
  const color =
    percent >= 70 ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : percent >= 30 ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" : "var(--border-color)";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden border border-border/20">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-text-muted w-8 text-right shrink-0">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

type StatusFilter = "ACTIVE" | "ARCHIVED" | "ALL";
type ViewMode = "list" | "grid";

export function ProjectList({
  initialProjects,
}: {
  initialProjects: ProjectData[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setActiveDropdown(null);
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      )
        setShowStatusMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleArchive = async (project: ProjectData) => {
    setActiveDropdown(null);
    setArchivingId(project.id);
    const next = !project.isArchived;
    try {
      const res = await fetch(`/api/projects/${project.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: next }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, isArchived: next } : p,
          ),
        );
        toast.success(
          next ? `Archived "${project.name}"` : `Restored "${project.name}"`,
        );
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update project");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating project");
    } finally {
      setArchivingId(null);
    }
  };

  const STATUS_LABEL: Record<StatusFilter, string> = {
    ACTIVE: "Active",
    ARCHIVED: "Archived",
    ALL: "All",
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ARCHIVED"
          ? p.isArchived
          : !p.isArchived;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-2xs">
            {initialProjects.length}
          </span>
        </div>
        <Link
          href="?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md hover:-translate-y-0.5 active:translate-y-0 hover:shadow-indigo-500/20 transition-all"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)" }}
        >
          <Plus size={14} strokeWidth={3} />
          New project
        </Link>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between mb-5 gap-4 p-3.5 bg-surface/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500"
              size={14}
            />
            <input
              type="text"
              aria-label="Search projects"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 h-8.5 text-xs font-bold border border-border bg-background text-text-main rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 w-52 transition-all duration-200"
            />
          </div>
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              className={[
                "h-8.5 flex items-center gap-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer outline-none",
                statusFilter !== "ACTIVE"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-900 shadow-2xs"
                  : "border-border bg-background text-text-main hover:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20",
              ].join(" ")}
            >
               Status: {STATUS_LABEL[statusFilter]} <ChevronDown size={12} className="text-text-muted" />
            </button>
            {showStatusMenu && (
              <div
                className="absolute left-0 mt-1.5 w-40 bg-surface rounded-xl py-1 z-35 overflow-hidden shadow-lg border border-border animate-fade-up"
              >
                {(["ACTIVE", "ARCHIVED", "ALL"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowStatusMenu(false);
                    }}
                    className={[
                      "w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer",
                      statusFilter === s
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-text-main hover:bg-surface-hover",
                    ].join(" ")}
                  >
                    {STATUS_LABEL[s]}
                    {statusFilter === s && <Check size={13} strokeWidth={3} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-1 bg-background border border-border/80 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "list" ? "bg-surface shadow-xs text-indigo-600 font-bold" : "text-text-muted hover:text-text-main"}`}
          >
            <LayoutList size={14} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "grid" ? "bg-surface shadow-xs text-indigo-600 font-bold" : "text-text-muted hover:text-text-main"}`}
          >
            <Grid size={14} />
          </button>
        </div>
      </div>

      {/* ── Table (list view) ────────────────────────────── */}
      {viewMode === "list" && (
        <div className="rounded-xl bg-surface border border-border shadow-sm overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] font-black text-text-muted uppercase tracking-widest bg-slate-50/75 dark:bg-slate-900/45 backdrop-blur-xs">
                <th className="pl-4 pr-5 py-4">
                  Project
                </th>
                <th className="px-5 py-4 w-36">
                  Health
                </th>
                <th className="px-5 py-4 w-48">
                  Automation
                </th>
                <th className="px-5 py-4 w-44">
                  Runs
                </th>
                <th className="px-5 py-4 w-28">
                  Team
                </th>
                <th className="pr-4 py-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, idx) => {
                const pal = PROJECT_PALETTES[idx % PROJECT_PALETTES.length];
                const isOpen = activeDropdown === project.id;

                return (
                  <tr
                    key={project.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/80 transition-all duration-200 group"
                  >
                    {/* PROJECT — left accent border via pseudo box-shadow trick on first td */}
                    <td className="pl-0 pr-5 py-4 align-middle">
                      <Link
                        href={`/projects/${project.code}/repository`}
                        className="flex items-center gap-3 pl-4"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs group-hover:scale-105 transition-all duration-200"
                          style={{ 
                            background: pal.gradient || pal.bg,
                            boxShadow: `0 4px 12px ${pal.shadow}`
                          }}
                        >
                          {project.code.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-main text-sm group-hover:text-indigo-600 transition-colors">
                              {project.name}
                            </span>
                            {project.isArchived && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/50 shadow-2xs">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-semibold text-text-muted">
                              {project.testCasesCount} cases
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-semibold text-text-muted">
                              {project.suitesCount} suites
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-semibold text-text-muted">
                              {timeAgo(project.updatedAt)}
                            </span>
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
                        <Link
                          href={`/projects/${project.code}/runs`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_#10b981]" />
                          {project.activeRunsCount} active
                          <span className="text-slate-300 font-normal">/</span>
                          <span className="text-text-muted font-bold">
                            {project.testRunsCount} total
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-300 font-bold text-xs">—</span>
                      )}
                    </td>

                    {/* TEAM */}
                    <td className="px-5 py-4 align-middle">
                      {project.teamMembers > 0 ? (
                        <div className="flex -space-x-2">
                          {Array.from({
                            length: Math.min(project.teamMembers, 3),
                          }).map((_, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-xs"
                              style={{
                                background:
                                  PROJECT_PALETTES[i % PROJECT_PALETTES.length].gradient ||
                                  PROJECT_PALETTES[i % PROJECT_PALETTES.length].bg,
                              }}
                            >
                              U{i + 1}
                            </div>
                          ))}
                          {project.teamMembers > 3 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-muted shadow-xs">
                              +{project.teamMembers - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold text-xs">—</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="pr-4 py-4 align-middle text-right">
                      <div
                        className="relative inline-block"
                        ref={isOpen ? dropdownRef : null}
                      >
                        <button
                          onClick={() =>
                            setActiveDropdown(isOpen ? null : project.id)
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                          ${isOpen ? "bg-surface-hover text-text-main" : "text-slate-300 hover:text-text-muted hover:bg-surface-hover opacity-0 group-hover:opacity-100"}`}
                        >
                          <MoreVertical size={15} />
                        </button>

                        {isOpen && (
                          <div
                            className="absolute right-0 mt-1 w-48 bg-surface rounded-xl py-1 z-30 overflow-hidden"
                            style={{
                              border: "1px solid var(--border-color)",
                              boxShadow: "0 4px 20px rgba(79,70,229,0.30)",
                            }}
                          >
                            <Link
                              href={`/projects/${project.code}/dashboards`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                            >
                              <LayoutList
                                size={13}
                                className="text-text-muted"
                              />{" "}
                              View Dashboard
                            </Link>
                            <Link
                              href={`/projects/${project.code}/settings`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                            >
                              <Settings size={13} className="text-text-muted" />{" "}
                              Settings
                            </Link>
                            <div className="h-px bg-surface-hover my-1" />
                            <button
                              onClick={() => handleToggleArchive(project)}
                              disabled={archivingId === project.id}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              <Archive size={13} className="text-amber-400" />{" "}
                              {project.isArchived ? "Restore" : "Archive"}
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
                    <FolderOpen
                      size={32}
                      className="mx-auto mb-3 text-slate-200"
                    />
                    <p className="text-sm text-text-muted mb-3">
                      No projects found
                    </p>
                    <Link
                      href="?create=true"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Plus size={14} /> Create a project
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────── */}
      {viewMode === "grid" &&
        (filtered.length === 0 ? (
          <div className="rounded-xl bg-surface border border-border shadow-sm py-20 text-center">
            <FolderOpen size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-text-muted mb-3">No projects found</p>
            <Link
              href="?create=true"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} /> Create a project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project, idx) => {
              const pal = PROJECT_PALETTES[idx % PROJECT_PALETTES.length];
              const isOpen = activeDropdown === project.id;
              return (
                <div
                  key={project.id}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative bg-surface rounded-2xl border border-border/80 shadow-xs hover:-translate-y-1.5 hover:scale-[1.02] duration-300 transition-all overflow-hidden cursor-pointer"
                  style={{ 
                    borderTop: `3.5px solid ${pal.border}`,
                    boxShadow: hoveredId === project.id 
                      ? `0 20px 25px -5px ${pal.shadow}, 0 8px 10px -6px ${pal.shadow}, 0 0 15px -3px ${pal.shadow}` 
                      : undefined
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <Link
                        href={`/projects/${project.code}/repository`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                          style={{ background: pal.gradient || pal.bg }}
                        >
                          {project.code.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-main text-sm truncate group-hover:text-indigo-600 transition-colors">
                              {project.name}
                            </span>
                            {project.isArchived && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/50 shadow-2xs shrink-0">
                                Archived
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-2xs w-max mt-1.5 inline-block">
                            {project.code}
                          </span>
                        </div>
                      </Link>
                      <div
                        className="relative shrink-0"
                        ref={isOpen ? dropdownRef : null}
                      >
                        <button
                          onClick={() =>
                            setActiveDropdown(isOpen ? null : project.id)
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isOpen ? "bg-surface-hover text-text-main" : "text-slate-300 hover:text-text-muted hover:bg-surface-hover"}`}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {isOpen && (
                          <div
                            className="absolute right-0 mt-1.5 w-48 bg-surface rounded-xl py-1 z-35 overflow-hidden shadow-lg border border-border animate-fade-up"
                          >
                            <Link
                              href={`/projects/${project.code}/dashboards`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                            >
                              <LayoutList
                                size={13}
                                className="text-text-muted"
                              />{" "}
                              View Dashboard
                            </Link>
                            <Link
                              href={`/projects/${project.code}/settings`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
                            >
                              <Settings size={13} className="text-text-muted" />{" "}
                              Settings
                            </Link>
                            <div className="h-px bg-surface-hover my-1" />
                            <button
                              onClick={() => handleToggleArchive(project)}
                              disabled={archivingId === project.id}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              <Archive size={13} className="text-amber-400" />{" "}
                              {project.isArchived ? "Restore" : "Archive"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] font-semibold text-text-muted mb-4">
                      <span>{project.testCasesCount} cases</span>
                      <span className="text-slate-300">•</span>
                      <span>{project.suitesCount} suites</span>
                      <span className="text-slate-300">•</span>
                      <span>{project.milestonesCount} milestones</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted/80 uppercase tracking-widest">
                          Health
                        </span>
                        <HealthBadge rate={project.latestRunPassRate} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black text-text-muted/80 uppercase tracking-widest shrink-0">
                          Automation
                        </span>
                        <AutomationBar percent={project.automationPercent} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted/80 uppercase tracking-widest">
                          Runs
                        </span>
                        {project.testRunsCount > 0 ? (
                          <Link
                            href={`/projects/${project.code}/runs`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                            {project.activeRunsCount} active{" "}
                            <span className="text-slate-300 font-normal">/</span>{" "}
                            <span className="text-text-muted font-bold">
                              {project.testRunsCount}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </>
  );
}
