"use client";

import React, { use } from "react";
import useSWR from "swr";
import { PdfReportTemplate } from "@/components/runs/PdfReportTemplate";
import { Loader2 } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      if (res.status === 403)
        throw new Error("This report is not public or has been disabled.");
      if (res.status === 404) throw new Error("Report not found.");
      throw new Error("An error occurred while fetching the report.");
    }
    return res.json();
  });

export default function PublicReportPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);

  // Poll every 3 seconds for real-time updates
  const {
    data: run,
    error,
    isLoading,
  } = useSWR(`/api/public/reports/${runId}`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-primary mb-4" size={48} />
          <p className="text-text-muted font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
        <div className="bg-background border border-border/80 p-8 rounded-2xl shadow-premium max-w-md w-full text-center animate-in zoom-in-95 duration-200">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">
            Access Denied
          </h2>
          <p className="text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!run) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4 transition-colors">
      <div className="w-full max-w-[1000px] mb-5 flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-text-muted uppercase tracking-widest">
            Live Report
          </span>
        </div>
        <div className="text-[11px] font-semibold text-text-muted/60">
          Auto-updating every 3 seconds
        </div>
      </div>

      <div className="w-full max-w-[1000px] bg-surface shadow-premium rounded-2xl overflow-hidden border border-border/80 animate-in zoom-in-95 duration-300">
        <PdfReportTemplate
          run={run}
          projectCode={run.project?.code || "UNKNOWN"}
        />
      </div>
    </div>
  );
}
