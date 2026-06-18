"use client";
// Force rebuild for TestRunsList

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  Edit,
  CheckCircle2,
  XCircle,
  Ban,
  CircleDashed,
} from "lucide-react";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";

// Vivid leading chip per run status — colored fill + white icon + glow.
const STATUS_CHIP: Record<
  string,
  { bg: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }
> = {
  Passed: { bg: "#10b981", Icon: CheckCircle2 },
  Failed: { bg: "#ef4444", Icon: XCircle },
  "In Progress": { bg: "#6366f1", Icon: Play },
  Completed: { bg: "#64748b", Icon: CheckCircle2 },
  Aborted: { bg: "#e11d48", Icon: Ban },
  Empty: { bg: "#94a3b8", Icon: CircleDashed },
};

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

const AVATAR_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#e11d48",
  "#0284c7",
  "#9333ea",
];
function authorMeta(
  author: { name?: string | null; email?: string | null } | null | undefined,
) {
  const display = author?.name || author?.email?.split("@")[0] || "Unknown";
  const parts = display.split(" ");
  const initials = (
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : display.substring(0, 2)
  ).toUpperCase();
  let sum = 0;
  for (let i = 0; i < display.length; i++) sum += display.charCodeAt(i);
  return {
    display,
    initials,
    color: AVATAR_COLORS[sum % AVATAR_COLORS.length],
  };
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (runId: string) => {
    const backup = [...runs];
    setRuns((prev) => prev.filter((r) => r.id !== runId));
    setActiveDropdown(null);

    try {
      const res = await fetch(`/api/runs/${runId}`, { method: "DELETE" });
      if (!res.ok) {
        setRuns(backup);
        toast.error("Failed to delete test run.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setRuns(backup);
      toast.error("An error occurred while deleting the test run.");
    }
  };

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = run.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / rowsPerPage));
  const paginatedRuns = filteredRuns.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  // ── Status-grouped board zones ──
  const zoneOf = (run: any) => {
    if (run.status === "COMPLETED") return "COMPLETED";
    if (run.status === "ABORTED") return "ABORTED";
    return "ACTIVE";
  };
  const ZONES = [
    { key: "ACTIVE", label: "Active", dot: "#6366f1" },
    { key: "COMPLETED", label: "Completed", dot: "#10b981" },
    { key: "ABORTED", label: "Aborted", dot: "#e11d48" },
  ] as const;
  const grouped: Record<string, any[]> = {
    ACTIVE: [],
    COMPLETED: [],
    ABORTED: [],
  };
  filteredRuns.forEach((r) => grouped[zoneOf(r)].push(r));

  const renderRunRow = (run: any, idx: number, hero: boolean) => {
    const passed = run.results.filter((r: any) => r.status === "PASSED").length;
    const failed = run.results.filter((r: any) => r.status === "FAILED").length;
    const blocked = run.results.filter((r: any) => r.status === "BLOCKED").length;
    const skipped = run.results.filter((r: any) => r.status === "SKIPPED").length;
    const untested = run.results.filter((r: any) => r.status === "IN_PROGRESS").length;
    const total = run.results.length;
    const completed = passed + failed + blocked + skipped;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const segs = [
      { n: passed, c: "#10b981" },
      { n: failed, c: "#ef4444" },
      { n: blocked, c: "#f59e0b" },
      { n: skipped, c: "#94a3b8" },
      { n: untested, c: "#cbd5e1" },
    ].filter((s) => s.n > 0);

    let statusLabel = "Empty";
    if (total > 0) {
      if (run.status === "COMPLETED") statusLabel = "Completed";
      else if (run.status === "ABORTED") statusLabel = "Aborted";
      else if (failed > 0) statusLabel = "Failed";
      else if (passed === total) statusLabel = "Passed";
      else statusLabel = "In Progress";
    }
    const chip = STATUS_CHIP[statusLabel] || STATUS_CHIP.Empty;
    const ChipIcon = chip.Icon;

    const start = new Date(run.createdAt);
    const end = run.status === "ACTIVE" ? new Date() : new Date(run.updatedAt);
    let elapsedMs = end.getTime() - start.getTime();
    if (elapsedMs < 0) elapsedMs = 0;
    const a = authorMeta(run.author);

    return (
      <div
        key={run.id}
        className={`group flex items-center gap-3 px-4 rounded-xl border transition-all animate-list-in ${
          hero
            ? "py-4 bg-indigo-50/40 border-indigo-200 hover:shadow-md"
            : "py-3 bg-surface border-border hover:border-indigo-200 hover:shadow-sm"
        }`}
        style={{ animationDelay: `${Math.min(idx, 10) * 45}ms` }}
      >
        {/* completion ring (hero) or status chip */}
        {hero ? (
          <div
            className="relative w-11 h-11 shrink-0"
            style={{
              background: `conic-gradient(${chip.bg} ${completionPercent * 3.6}deg, var(--bg-surface-hover) 0deg)`,
              borderRadius: "9999px",
            }}
          >
            <div className="absolute inset-1 rounded-full bg-surface flex items-center justify-center text-[11px] font-extrabold" style={{ color: chip.bg }}>
              {completionPercent}%
            </div>
          </div>
        ) : (
          <span
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3"
            style={{ background: chip.bg, boxShadow: `0 3px 10px ${chip.bg}55` }}
            aria-hidden="true"
          >
            <ChipIcon size={18} strokeWidth={2.25} />
          </span>
        )}

        <Link href={`/projects/${code}/runs/${run.id}`} className="flex-1 min-w-0">
          <span className={`block font-bold text-text-main tracking-tight group-hover:text-indigo-600 transition-colors truncate ${hero ? "text-[15px]" : "text-[14px]"}`}>
            {run.title}
          </span>
          <span className="block text-[11px] text-text-muted truncate mt-0.5">
            {a.display} · {timeAgo(run.createdAt)}
            {run.environment?.title ? ` · ${run.environment.title}` : ""} ·{" "}
            {formatDuration(elapsedMs)}
          </span>
        </Link>

        {/* mini stats bar */}
        {total > 0 && (
          <div className="hidden sm:flex h-2 w-36 shrink-0 rounded-full overflow-hidden bg-surface-hover">
            {segs.map((s, i) => (
              <div
                key={i}
                style={{ width: `${(s.n / total) * 100}%`, background: s.c }}
              />
            ))}
          </div>
        )}
        <span className="text-[11px] font-bold text-text-muted w-14 text-right shrink-0">
          {completed}/{total}
        </span>

        <div
          className="relative shrink-0"
          ref={activeDropdown === run.id ? dropdownRef : null}
        >
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === run.id ? null : run.id)
            }
            className={`p-1.5 rounded-lg transition-colors ${activeDropdown === run.id ? "bg-surface-hover text-text-main" : "text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
          >
            <MoreVertical size={18} />
          </button>
          {activeDropdown === run.id && (
            <div className="absolute right-0 mt-1 w-40 bg-surface border border-border rounded-xl shadow-lg z-30 py-1 overflow-hidden">
              <Link
                href={`/projects/${code}/runs/${run.id}`}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
              >
                <Play size={13} className="mr-2 text-text-muted" /> Open run
              </Link>
              <Link
                href={`/projects/${code}/runs/${run.id}/edit`}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center transition-colors"
              >
                <Edit size={13} className="mr-2 text-text-muted" /> Edit run
              </Link>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  setConfirmDeleteId(run.id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center transition-colors"
              >
                <Trash2 size={13} className="mr-2" /> Delete run
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        {role !== "VIEWER" && (
          <Link
            href={`/projects/${code}/runs/create`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
            style={{ background: "var(--primary)" }}
          >
            Start new test run
          </Link>
        )}

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={14}
          />
          <input
            type="text"
            placeholder="Search test runs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-4 h-8 text-sm border border-border bg-surface text-text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 w-52 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={[
              "flex items-center h-8 text-xs px-3 rounded-lg border transition-colors font-semibold",
              showFilters || statusFilter !== "ALL"
                ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                : "bg-surface text-text-main border-border hover:text-text-main hover:bg-surface-hover",
            ].join(" ")}
          >
            <Filter size={13} className="mr-1.5" />
            {statusFilter === "ALL" ? "All Statuses" : statusFilter}
          </button>

          {showFilters && (
            <div className="absolute top-full mt-1 left-0 w-44 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
              {["ALL", "ACTIVE", "COMPLETED", "ABORTED"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setShowFilters(false);
                  }}
                  className={[
                    "w-full text-left px-4 py-2 text-sm font-medium transition-colors",
                    statusFilter === s
                      ? "bg-indigo-50 text-indigo-900"
                      : "text-text-main hover:bg-surface-hover",
                  ].join(" ")}
                >
                  {s === "ALL"
                    ? "All Statuses"
                    : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">
            No test runs found
          </h3>
          <p className="text-text-muted text-center max-w-sm mb-6 text-sm">
            {role !== "VIEWER"
              ? "Create a new test run to start executing tests and tracking quality."
              : "There are currently no test runs for this project."}
          </p>
          {role !== "VIEWER" && (
            <Link
              href={`/projects/${code}/runs/create`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
              style={{
                background: "var(--primary)",
              }}
            >
              Start test run
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {ZONES.map((zone) => {
            const zoneRuns = grouped[zone.key];
            if (zoneRuns.length === 0) return null;
            return (
              <section key={zone.key}>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: zone.dot }}
                  />
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                    {zone.label}
                  </h3>
                  <span className="text-[11px] font-bold text-text-muted">
                    {zoneRuns.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {zoneRuns.map((run, i) =>
                    renderRunRow(run, i, zone.key === "ACTIVE"),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete test run"
          message="This test run and all its results will be permanently deleted. This action cannot be undone."
          onConfirm={() => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            handleDelete(id);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
