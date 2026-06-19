"use client";

import React from "react";
import { Terminal, CheckCircle2, XCircle, Activity } from "lucide-react";

interface RecentActivityStreamProps {
  auditLogs: any[];
}

export function RecentActivityStream({ auditLogs }: RecentActivityStreamProps) {
  const activities = auditLogs.length > 0 ? auditLogs : [
    {
      id: "mock-1",
      action: "RUN_COMPLETED",
      entity: "TestRun",
      details: "Completed execution of run ECOM-104 with 92% pass rate",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      user: { name: "Supat T", email: "supat.t@gmail.com" },
      project: { name: "ECOM", code: "ECOM" }
    },
    {
      id: "mock-2",
      action: "CASE_CREATED",
      entity: "TestCase",
      details: "Created test case WP-189: Verify checkout with code discount",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      user: { name: "Supat T", email: "supat.t@gmail.com" },
      project: { name: "ECOM", code: "ECOM" }
    },
    {
      id: "mock-3",
      action: "SYNC_COMPLETED",
      entity: "GithubSync",
      details: "Synced 12 automated Playwright tests to main branch",
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
      user: { name: "System Pipeline", email: "system@qmaster.com" },
      project: { name: "PRO", code: "PRO" }
    }
  ];

  const getEventStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAIL") || act.includes("DELETE") || act.includes("ERROR")) {
      return {
        icon: <XCircle size={11} className="text-red-500" />,
        bg: "bg-red-500/10 text-red-400 border-red-500/20"
      };
    }
    if (act.includes("CREATE") || act.includes("SYNC") || act.includes("ADD") || act.includes("COMPLETE") || act.includes("SUCCESS")) {
      return {
        icon: <CheckCircle2 size={11} className="text-emerald-500" />,
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      };
    }
    return {
      icon: <Activity size={11} className="text-indigo-500" />,
      bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    };
  };

  return (
    <div className="bg-[#0f141c] text-slate-300 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[400px]">
      <div className="px-5 py-4 border-b border-slate-800 bg-[#161d28] flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400 animate-pulse" />
          NOC QA Activity Log
        </h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] leading-relaxed">
        {activities.map((act: any) => {
          const style = getEventStyle(act.action);
          return (
            <div key={act.id} className="flex items-start gap-2.5 pb-2 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/10 px-1 rounded transition-colors">
              <span className="text-[#64748b] shrink-0">
                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${style.bg}`}>
                {act.project?.code || "SYS"}
              </span>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-slate-200 font-semibold">
                  {act.user ? (act.user.name || act.user.email.split("@")[0]) : "System"}:{" "}
                </span>
                <span className="text-slate-400 break-words">{act.details || `${act.action} on ${act.entity}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
