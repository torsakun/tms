"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  LayoutList,
  Grid,
  ChevronDown,
  Plus,
  FolderOpen,
} from "lucide-react";

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

const avs = [
  ["var(--primary-soft)", "var(--primary-text)"],
  ["var(--info-soft-fill)", "var(--info)"],
  ["var(--pass-soft)", "var(--pass)"],
  ["var(--warn-soft)", "var(--warn)"],
];

const healthColors = (h: number | null) => {
  if (h === null) return ["var(--surface-hover)", "var(--text-faint)"];
  if (h >= 90) return ["var(--pass-soft)", "var(--pass)"];
  if (h >= 75) return ["var(--warn-soft)", "var(--warn)"];
  return ["var(--fail-soft)", "var(--fail)"];
};

const iconC = [
  ["var(--primary-soft)", "var(--primary-text)"],
  ["var(--info-soft-fill)", "var(--info)"],
  ["var(--pass-soft)", "var(--pass)"],
  ["var(--warn-soft)", "var(--warn)"],
];

type ViewMode = "list" | "grid";

export function ProjectList({
  initialProjects,
}: {
  initialProjects: ProjectData[];
}) {
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const filtered = projects.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="w-full bg-background text-[14px] leading-[1.45] text-text-main antialiased font-sans">
      <div className="mx-auto w-full max-w-[1180px] p-[22px]">
        {/* header */}
        <div className="mb-[18px] flex items-center gap-3">
          <div>
            <div className="text-[21px] font-semibold tracking-[-0.015em]">Projects</div>
            <div className="mt-0.5 text-[13px] text-text-muted">
              {projects.length} projects across the workspace
            </div>
          </div>
          <div className="flex-1"></div>
          <Link
            href="?create=true"
            className="flex h-[36px] items-center gap-2 rounded-[9px] bg-primary px-3 text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus size={16} /> New project
          </Link>
        </div>

        {/* toolbar */}
        <div className="mb-[16px] flex items-center gap-2.5">
          <div className="flex min-w-[200px] h-[36px] items-center gap-2 rounded-[9px] bg-surface px-[11px] text-[12.5px] text-text-faint shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--primary)] transition-shadow">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search projects"
              className="flex-1 bg-transparent text-text-main outline-none placeholder:text-text-faint"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex h-[36px] cursor-pointer items-center gap-1.5 rounded-[9px] bg-surface px-3 text-[12.5px] font-medium shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface-hover">
            All statuses <ChevronDown size={17} className="text-text-faint" />
          </div>
          <div className="flex-1"></div>
          {/* segmented view toggle */}
          <div className="flex gap-[3px] rounded-[9px] border border-border bg-surface-hover p-[3px]">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-[5px] rounded-[7px] px-[11px] py-[5px] text-[12px] font-semibold transition-colors ${
                viewMode === "list" ? "bg-surface shadow-sm text-text-main" : "text-text-muted hover:text-text-main"
              }`}
            >
              <LayoutList size={16} /> List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-[5px] rounded-[7px] px-[11px] py-[5px] text-[12px] font-semibold transition-colors ${
                viewMode === "grid" ? "bg-surface shadow-sm text-text-main" : "text-text-muted hover:text-text-main"
              }`}
            >
              <Grid size={16} /> Grid
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">Empty state</div>
            <div className="flex flex-col items-center rounded-[13px] border border-border bg-surface p-10 text-center shadow-sm">
              <div className="mb-[14px] flex h-[56px] w-[56px] items-center justify-center rounded-[15px] bg-primary-light">
                <FolderOpen size={28} className="text-primary" />
              </div>
              <div className="text-[15.5px] font-semibold">No projects yet</div>
              <div className="my-1.5 max-w-[300px] text-[13px] text-text-muted mb-4">
                Create a project to start organizing suites, cases and test runs for a product area.
              </div>
              <Link
                href="?create=true"
                className="flex h-[40px] items-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
              >
                <Plus size={18} /> New project
              </Link>
            </div>
          </>
        ) : viewMode === "list" ? (
          <>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">List view</div>
            <div className="mb-[26px] overflow-hidden rounded-[13px] border border-border bg-surface shadow-sm">
              <div className="grid grid-cols-[2.2fr_96px_130px_90px_110px] gap-[14px] border-b border-border p-[10px_18px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                <div>Project</div><div>Health</div><div>Automation</div><div>Runs</div><div>Team</div>
              </div>
              {filtered.map((p, idx) => {
                const hBg = healthColors(p.latestRunPassRate)[0];
                const hColor = healthColors(p.latestRunPassRate)[1];
                const iBg = iconC[idx % 4][0];
                const iColor = iconC[idx % 4][1];
                return (
                  <Link href={`/projects/${p.code}/dashboards`} key={p.id} className="grid grid-cols-[2.2fr_96px_130px_90px_110px] items-center gap-[14px] border-b border-border p-[13px_18px] hover:bg-surface-hover">
                    <div className="flex min-w-0 items-center gap-[11px]">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold" style={{ background: iBg, color: iColor }}>
                        {p.code.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
                        <div className="text-[11.5px] text-text-faint">{p.testCasesCount} cases · {p.suitesCount} suites · {timeAgo(p.updatedAt)}</div>
                      </div>
                    </div>
                    <div>
                      <span className="rounded-full px-[9px] py-[3px] tabular-nums text-[11.5px] font-bold" style={{ background: hBg, color: hColor }}>
                        {p.latestRunPassRate !== null ? `${Math.round(p.latestRunPassRate)}%` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-surface-hover">
                        <div className="h-full bg-primary" style={{ width: `${p.automationPercent}%` }}></div>
                      </div>
                      <span className="tabular-nums text-[11.5px] font-semibold text-text-muted">{Math.round(p.automationPercent)}%</span>
                    </div>
                    <div className="tabular-nums text-[12.5px]">
                      <span className="font-bold text-primary">{p.activeRunsCount}</span>
                      <span className="text-text-faint"> / {p.testRunsCount}</span>
                    </div>
                    <div className="flex">
                      {Array.from({ length: Math.min(p.teamMembers || 1, 3) }).map((_, i) => (
                        <div key={i} className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-[9.5px] font-bold shadow-[0_0_0_2px_var(--surface)]" style={{ background: avs[i % 4][0], color: avs[i % 4][1], marginLeft: i === 0 ? "0" : "-7px" }}>
                          U{i + 1}
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">Grid view</div>
            <div className="mb-[26px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, idx) => {
                const hBg = healthColors(p.latestRunPassRate)[0];
                const hColor = healthColors(p.latestRunPassRate)[1];
                const iBg = iconC[idx % 4][0];
                const iColor = iconC[idx % 4][1];
                return (
                  <Link href={`/projects/${p.code}/dashboards`} key={p.id} className="rounded-[13px] border border-border bg-surface p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="mb-[14px] flex items-center gap-2.5">
                      <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[14px] font-bold" style={{ background: iBg, color: iColor }}>
                        {p.code.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
                        <div className="text-[11px] text-text-faint">{p.testCasesCount} cases · {p.suitesCount} suites</div>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: hBg, color: hColor }}>
                        {p.latestRunPassRate !== null ? `${Math.round(p.latestRunPassRate)}%` : "—"}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="w-[62px] text-[11px] text-text-faint">Automation</span>
                      <div className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-surface-hover">
                        <div className="h-full bg-primary" style={{ width: `${p.automationPercent}%` }}></div>
                      </div>
                      <span className="text-[11px] font-semibold text-text-muted">{Math.round(p.automationPercent)}%</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-[11.5px] text-text-muted">
                        <span className="font-bold text-primary">{p.activeRunsCount}</span> active runs
                      </span>
                      <div className="flex">
                        {Array.from({ length: Math.min(p.teamMembers || 1, 3) }).map((_, i) => (
                          <div key={i} className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold shadow-[0_0_0_2px_var(--surface)]" style={{ background: avs[i % 4][0], color: avs[i % 4][1], marginLeft: i === 0 ? "0" : "-7px" }}>
                            U{i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
