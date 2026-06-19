"use client";

import React from "react";
import { Activity, CheckCircle2, Terminal, XCircle } from "lucide-react";

interface RecentActivityStreamProps {
  auditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    details: string | null;
    createdAt: Date;
    user: { name: string | null; email: string } | null;
    project: { name: string; code: string } | null;
  }>;
}

export function RecentActivityStream({ auditLogs }: RecentActivityStreamProps) {
  const getEventStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAIL") || act.includes("DELETE") || act.includes("ERROR")) {
      return {
        icon: <XCircle size={11} className="text-red-500" />,
        bg: "bg-red-50 text-red-700 border-red-200/70 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25"
      };
    }
    if (act.includes("CREATE") || act.includes("SYNC") || act.includes("ADD") || act.includes("COMPLETE") || act.includes("SUCCESS")) {
      return {
        icon: <CheckCircle2 size={11} className="text-emerald-500" />,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25"
      };
    }
    return {
      icon: <Activity size={11} className="text-indigo-500" />,
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25"
    };
  };

  return (
    <section className="flex max-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-text-main">
          <Terminal size={17} className="text-primary" />
          Activity Stream
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {auditLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-hover/35 px-6 text-center">
            <Activity size={22} className="text-text-muted" />
            <p className="mt-3 text-sm font-bold text-text-main">
              No activity recorded yet
            </p>
            <p className="mt-1 max-w-[28ch] text-sm leading-5 text-text-muted">
              New project, run, case, and automation events will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {auditLogs.map((act) => {
              const style = getEventStyle(act.action);
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-md border border-border/70 bg-background px-3 py-2.5 transition-colors duration-150 hover:bg-surface-hover"
                >
                  <span className="w-16 shrink-0 select-none font-mono text-xs font-medium tabular-nums text-text-muted">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold ${style.bg} select-none`}
                  >
                    {style.icon}
                    {act.project?.code || "SYS"}
                  </span>
                  <div className="min-w-0 flex-1 text-left text-sm leading-5">
                    <span className="font-bold text-text-main">
                      {act.user
                        ? act.user.name || act.user.email.split("@")[0]
                        : "System"}
                      :{" "}
                    </span>
                    <span className="break-words text-text-muted">
                      {act.details || `${act.action} on ${act.entity}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
