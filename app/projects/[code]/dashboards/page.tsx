import React from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  PlayCircle,
  Activity,
  Settings,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let projectData = null;
  let dashboardData = {
    metrics: { totalSuites: 0, totalCases: 0, totalRuns: 0, activeRuns: 0 },
    severityCounts: [] as { severity: string; count: number }[],
    recentRuns: [] as any[],
    outdatedCases: [] as any[],
  };

  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        _count: { select: { suites: true, testCases: true, testRuns: true } },
        members: true,
      },
    });

    if (project) {
      projectData = project;
      const activeRunsCount = await prisma.testRun.count({
        where: { projectId: project.id, status: "ACTIVE" },
      });

      const severityGroups = await prisma.testCase.groupBy({
        by: ["severity"],
        where: { projectId: project.id },
        _count: { id: true },
      });

      const recentRuns = await prisma.testRun.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { results: { select: { status: true } } },
      });

      const outdatedCases = await prisma.testCase.findMany({
        where: { projectId: project.id, isOutdated: true },
        select: { id: true, title: true, jiraId: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });

      dashboardData = {
        metrics: {
          totalSuites: project._count.suites,
          totalCases: project._count.testCases,
          totalRuns: project._count.testRuns,
          activeRuns: activeRunsCount,
        },
        severityCounts: severityGroups.map((g) => ({
          severity: g.severity,
          count: g._count.id,
        })),
        recentRuns: recentRuns.map((run) => {
          const total = run.results.length;
          const passed = run.results.filter((r) => r.status === "PASSED").length;
          const failed = run.results.filter((r) => r.status === "FAILED").length;
          const blocked = run.results.filter((r) => r.status === "BLOCKED").length;
          const skipped = run.results.filter((r) => r.status === "SKIPPED").length;
          const untested = total - passed - failed - blocked - skipped;
          return {
            id: run.id,
            title: run.title,
            status: run.status,
            createdAt: run.createdAt,
            metrics: { total, passed, failed, blocked, skipped, untested },
          };
        }),
        outdatedCases,
      };
    }
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
  }

  if (!projectData) {
    return <div className="p-8">Project not found</div>;
  }

  const { metrics, severityCounts, recentRuns, outdatedCases } = dashboardData;

  const severityOrder = ["BLOCKER", "CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL"];
  const severityConfig: Record<string, { color: string; bar: string; label: string }> = {
    BLOCKER:  { color: "text-red-700",    bar: "bg-red-600",    label: "Blocker" },
    CRITICAL: { color: "text-red-600",    bar: "bg-red-500",    label: "Critical" },
    MAJOR:    { color: "text-orange-600", bar: "bg-orange-500", label: "Major" },
    NORMAL:   { color: "text-blue-600",   bar: "bg-blue-500",   label: "Normal" },
    MINOR:    { color: "text-emerald-600",bar: "bg-emerald-500",label: "Minor" },
    TRIVIAL:  { color: "text-slate-500",  bar: "bg-slate-400",  label: "Trivial" },
  };

  const getSeverityCount = (sev: string) =>
    severityCounts.find((s) => s.severity === sev)?.count || 0;

  return (
    <div className="flex flex-col flex-1 bg-[#f0f2f8] min-h-0 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto w-full px-6 py-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {projectData.name}
              </h1>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">
                {projectData.code}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {metrics.totalCases} test cases · {metrics.totalSuites} suites · {projectData.members.length} members
            </p>
          </div>
          <Link
            href={`/projects/${code}/settings`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Settings size={15} />
            Settings
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", boxShadow: "0 4px 20px rgba(79,70,229,0.30)" }}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Test Cases</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{metrics.totalCases}</div>
            <div className="text-xs text-white/60 mt-1">
              <Link href={`/projects/${code}/repository`} className="hover:text-white underline underline-offset-2 transition-colors">
                View repository →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", boxShadow: "0 4px 20px rgba(8,145,178,0.30)" }}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Test Suites</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Folder size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{metrics.totalSuites}</div>
          </div>

          <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", boxShadow: "0 4px 20px rgba(124,58,237,0.30)" }}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Total Runs</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <PlayCircle size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{metrics.totalRuns}</div>
            <div className="text-xs text-white/60 mt-1">
              <Link href={`/projects/${code}/runs`} className="hover:text-white underline underline-offset-2 transition-colors">
                View all runs →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(5,150,105,0.30)" }}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Active Runs</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{metrics.activeRuns}</div>
            {metrics.activeRuns > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Running now
              </div>
            )}
          </div>
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Severity breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
              <h2 className="text-sm font-bold text-slate-800">Test Case Severity</h2>
            </div>
            <div className="flex-1 p-6">
              {metrics.totalCases > 0 ? (
                <div className="space-y-4">
                  {severityOrder.map((sev) => {
                    const count = getSeverityCount(sev);
                    const cfg = severityConfig[sev];
                    const percent = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                    return (
                      <div key={sev}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-slate-600">{cfg.label}</span>
                          <span className="font-bold text-slate-700">
                            {count}{" "}
                            <span className="text-slate-400 text-xs font-normal">({percent.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.bar} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <FileText size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">No test cases yet</p>
                  <Link href={`/projects/${code}/repository`}
                    className="mt-3 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                    + Add test cases
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent runs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" strokeWidth={2.5} />
                <h2 className="text-sm font-bold text-slate-800">Recent Execution Activity</h2>
              </div>
              <Link href={`/projects/${code}/runs`}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
                View all <ChevronRight size={13} />
              </Link>
            </div>

            <div className="flex-1 p-5">
              {recentRuns.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-3">
                    <PlayCircle size={26} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">No test runs yet</p>
                  <p className="text-slate-400 text-xs">Start a test run to track execution results</p>
                  <Link href={`/projects/${code}/runs/create`}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                    <Zap size={13} /> Start test run
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRuns.map((run) => {
                    const { total, passed, failed, blocked, skipped, untested } = run.metrics;
                    const passP = total > 0 ? (passed / total) * 100 : 0;
                    const failP = total > 0 ? (failed / total) * 100 : 0;
                    const blockP = total > 0 ? (blocked / total) * 100 : 0;
                    const skipP = total > 0 ? (skipped / total) * 100 : 0;
                    const untestedP = total > 0 ? (untested / total) * 100 : 0;
                    const isActive = run.status === "ACTIVE";
                    const hasFailed = failed > 0;
                    const allPassed = passed === total && total > 0;

                    return (
                      <Link key={run.id} href={`/projects/${code}/runs/${run.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                        <div className={`w-2 h-10 rounded-full shrink-0 ${isActive ? "bg-indigo-400 animate-pulse" : allPassed ? "bg-emerald-400" : hasFailed ? "bg-red-400" : "bg-slate-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                              {run.title}
                            </span>
                            <span className="text-[11px] text-slate-400 shrink-0 ml-3">
                              {new Date(run.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
                            <div style={{ width: `${passP}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${failP}%` }} className="bg-red-500" />
                            <div style={{ width: `${blockP}%` }} className="bg-amber-500" />
                            <div style={{ width: `${skipP}%` }} className="bg-slate-400" />
                            <div style={{ width: `${untestedP}%` }} className="bg-slate-200" />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold">
                            {passed > 0 && <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={11} />{passed}P</span>}
                            {failed > 0 && <span className="text-red-600 flex items-center gap-0.5"><XCircle size={11} />{failed}F</span>}
                            {untested > 0 && <span className="text-slate-400">{untested} untested</span>}
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outdated cases warning */}
        {outdatedCases.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                Impacted Test Cases — Jira Requirement Changed
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-800">
                  {outdatedCases.length}
                </span>
              </h2>
              <Link href={`/projects/${code}/repository`}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1">
                Go to Repository <ChevronRight size={13} />
              </Link>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {outdatedCases.map((tc) => (
                <div key={tc.id} className="bg-white border border-amber-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase tracking-wider">
                      Outdated
                    </span>
                    {tc.jiraId && (
                      <span className="text-[10px] text-slate-400 font-mono">{tc.jiraId}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 truncate">{tc.title}</p>
                  <p className="text-xs text-slate-400 mt-1.5">Needs AI Impact Analysis</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
