"use client";

import React, { useState, useEffect, use } from "react";
import {
  Activity,
  PlusCircle,
  Trash2,
  Edit2,
  PlayCircle,
  Share2,
  Loader2,
  Filter,
} from "lucide-react";
import { formatThaiTime } from "@/lib/utils";

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
  CREATED: {
    label: "created",
    icon: <PlusCircle size={13} />,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  DELETED: {
    label: "deleted",
    icon: <Trash2 size={13} />,
    bg: "bg-rose-50",
    text: "text-rose-500",
  },
  UPDATED: {
    label: "updated",
    icon: <Edit2 size={13} />,
    bg: "bg-indigo-50",
    text: "text-indigo-500",
  },
  EXECUTED: {
    label: "executed",
    icon: <PlayCircle size={13} />,
    bg: "bg-violet-50",
    text: "text-violet-500",
  },
  SHARED: {
    label: "shared",
    icon: <Share2 size={13} />,
    bg: "bg-amber-50",
    text: "text-amber-500",
  },
};

const COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#e11d48",
  "#0284c7",
  "#9333ea",
];
function avatarColor(s: string) {
  let n = 0;
  for (const c of s) n += c.charCodeAt(0);
  return COLORS[n % COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function groupByDate(logs: AuditLog[]) {
  const map: Record<string, AuditLog[]> = {};
  logs.forEach((log) => {
    const d = new Date(log.createdAt);
    const key = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (!map[key]) map[key] = [];
    map[key].push(log);
  });
  return map;
}

export default function AuditLogsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch(`/api/projects/${code}/audit`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed to fetch")))
      .then((d) => setLogs(d.logs || []))
      .catch((e) => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, [code]);

  const filtered =
    filter === "ALL" ? logs : logs.filter((l) => l.action === filter);
  const grouped = groupByDate(filtered);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    );

  if (error)
    return <div className="p-8 text-center text-rose-500 text-sm">{error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-main tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" /> Activity
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Track all actions and changes within this project
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
          {logs.length}
        </span>
      </div>

      {/* Filter chips */}
      {logs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "CREATED", "UPDATED", "DELETED", "EXECUTED"].map((a) => {
            const cfg = ACTION_CONFIG[a];
            const active = filter === a;
            return (
              <button
                key={a}
                onClick={() => setFilter(a)}
                className={`h-7 flex items-center gap-1.5 px-3 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-surface text-text-muted border-border hover:border-border"
                }`}
              >
                {cfg && (
                  <span className={active ? "text-white" : cfg.text}>
                    {cfg.icon}
                  </span>
                )}
                {a === "ALL" ? "All" : (cfg?.label ?? a.toLowerCase())}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border/80 shadow-premium py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
            <Activity size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-text-muted">
            No activity recorded yet
          </p>
          <p className="text-xs text-text-muted mt-1">
            Actions in this project will appear here
          </p>
        </div>
      )}

      {/* Timeline grouped by date */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                {date}
              </span>
              <div className="flex-1 h-px bg-surface-hover" />
            </div>

            <div className="bg-surface rounded-2xl border border-border/80 shadow-premium overflow-hidden">
              {items.map((log, i) => {
                const cfg = ACTION_CONFIG[log.action] ?? {
                  label: log.action.toLowerCase(),
                  icon: <Activity size={13} />,
                  bg: "bg-surface-hover",
                  text: "text-text-muted",
                };
                const name = log.user.name || log.user.email.split("@")[0];
                const time = new Date(log.createdAt).toLocaleTimeString(
                  "en-GB",
                  { hour: "2-digit", minute: "2-digit" },
                );
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-surface-hover/70 transition-colors ${i > 0 ? "border-t border-border/50" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarColor(name) }}
                    >
                      {initials(name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-main">
                          {name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-sm text-text-muted capitalize">
                          {log.entity.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-text-muted mt-1 truncate max-w-md">
                          {log.details}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-xs text-text-muted shrink-0 mt-0.5">
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
