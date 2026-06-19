import React from "react";
import Link from "next/link";
import {
  FileText,
  PlayCircle,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Folder,
  Activity,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  ExecutionTrendChart,
  AutomationDonutChart,
} from "./components/DashboardCharts";
import { ProjectQualityMatrix } from "./components/ProjectQualityMatrix";
import { RecentExecutionsTable } from "./components/RecentExecutionsTable";
import { UpcomingSchedules } from "./components/UpcomingSchedules";
import { DashboardToolbar } from "./components/DashboardToolbar";
import { QualityHeatmap } from "./components/QualityHeatmap";
import { RecentActivityStream } from "./components/RecentActivityStream";

export const dynamic = "force-dynamic";

export default async function GlobalDashboardPage(props: {
  searchParams: Promise<{ timeframe?: string; project?: string }>;
}) {
  const resolvedSearchParams = await props.searchParams;
  const timeframeStr = resolvedSearchParams.timeframe || "14";
  const projectCodeFilter = resolvedSearchParams.project || "";
  const timeframeDays = parseInt(timeframeStr);

  let dashboardData = {
    metrics: { totalProjects: 0, totalCases: 0, totalRuns: 0, passRate: 0 },
    automation: { automated: 0, manual: 0, toBeAutomated: 0 },
    projects: [] as any[],
    recentRuns: [] as any[],
    schedules: [] as any[],
    trendData: [] as any[],
    allProjectsForFilter: [] as any[],
    heatmapData: [] as any[],
    auditLogs: [] as any[],
  };

  try {
    const allProjectsForFilter = await prisma.project.findMany({
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    });

    const totalProjects = await prisma.project.count({
      where: projectCodeFilter ? { code: projectCodeFilter } : {},
    });
    const totalCases = await prisma.testCase.count({
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
    });
    const totalRuns = await prisma.testRun.count({
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
    });

    const automatedCasesCount = await prisma.testCase.count({
      where: {
        automationStatus: "AUTOMATED",
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
    });
    const manualCasesCount = await prisma.testCase.count({
      where: {
        automationStatus: "MANUAL",
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
    });
    const toBeAutomatedCount = await prisma.testCase.count({
      where: {
        automationStatus: "TO_BE_AUTOMATED",
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
    });

    // Project Quality Matrix Data
    const projectsList = await prisma.project.findMany({
      where: projectCodeFilter ? { code: projectCodeFilter } : {},
      include: {
        _count: { select: { testCases: true, testRuns: true } },
        testCases: { select: { automationStatus: true } },
        testRuns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { results: { select: { status: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Recent Runs Table Data
    const recentRuns = await prisma.testRun.findMany({
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        results: { select: { status: true } },
        project: { select: { name: true, code: true } },
      },
    });

    // Pipeline Schedules
    const schedules = await prisma.pipelineSchedule.findMany({
      where: {
        isActive: true,
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
      include: { project: { select: { name: true, code: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Fetch Trend Data for the timeframe
    const trendStartDate = new Date();
    trendStartDate.setDate(trendStartDate.getDate() - timeframeDays);

    const trendRuns = await prisma.testRun.findMany({
      where: {
        createdAt: { gte: trendStartDate },
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
      include: { results: { select: { status: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Group by Date
    const trendMap = new Map();
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      trendMap.set(dateStr, {
        date: dateStr,
        passed: 0,
        failed: 0,
        blocked: 0,
        skipped: 0,
      });
    }

    for (const run of trendRuns) {
      const dateStr = new Date(run.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (trendMap.has(dateStr)) {
        const item = trendMap.get(dateStr);
        run.results.forEach((res) => {
          if (res.status === "PASSED") item.passed++;
          if (res.status === "FAILED") item.failed++;
          if (res.status === "BLOCKED") item.blocked++;
          if (res.status === "SKIPPED") item.skipped++;
        });
      }
    }

    let totalPassed = 0;
    let totalExecuted = 0;

    // Quality heatmap matrix: 30 days history of runs per project
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const heatmapRuns = await prisma.testRun.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
      },
      include: {
        results: { select: { status: true } },
        project: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const projectDaysMap = new Map<string, Map<string, { passed: number, total: number }>>();
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dates.push(dateStr);
    }

    heatmapRuns.forEach((run) => {
      const dateStr = new Date(run.createdAt).toISOString().split("T")[0];
      const pCode = run.project.code;
      if (!projectDaysMap.has(pCode)) {
        projectDaysMap.set(pCode, new Map());
      }
      const dayMap = projectDaysMap.get(pCode)!;
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { passed: 0, total: 0 });
      }
      const dayStats = dayMap.get(dateStr)!;
      run.results.forEach((res) => {
        dayStats.total++;
        if (res.status === "PASSED") dayStats.passed++;
      });
    });

    const heatmapData = projectsList.map((p) => {
      const dayMap = projectDaysMap.get(p.code);
      const dailyHealth = dates.map((dateStr) => {
        const stats = dayMap?.get(dateStr);
        const passRate = stats && stats.total > 0 ? (stats.passed / stats.total) * 100 : null;
        return {
          date: dateStr,
          passRate,
          totalRuns: stats ? 1 : 0,
        };
      });

      return {
        code: p.code,
        name: p.name,
        dailyHealth,
      };
    });

    // Fetch real AuditLog entries
    const auditLogs = await prisma.auditLog.findMany({
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true, code: true } },
      },
    });

    dashboardData = {
      allProjectsForFilter,
      metrics: {
        totalProjects,
        totalCases,
        totalRuns,
        passRate: 0,
      },
      automation: {
        automated: automatedCasesCount,
        manual: manualCasesCount,
        toBeAutomated: toBeAutomatedCount,
      },
      projects: projectsList.map((p) => {
        const automated = p.testCases.filter(
          (tc) => tc.automationStatus === "AUTOMATED",
        ).length;
        const total = p.testCases.length;
        const autoPercent = total > 0 ? (automated / total) * 100 : 0;

        let lastRunHealth = null;
        if (p.testRuns.length > 0) {
          const run = p.testRuns[0];
          const passed = run.results.filter(
            (r) => r.status === "PASSED",
          ).length;
          const runTotal = run.results.length;
          lastRunHealth = runTotal > 0 ? (passed / runTotal) * 100 : null;
        }

        return {
          code: p.code,
          name: p.name,
          cases: total,
          runs: p._count.testRuns,
          automated: autoPercent,
          lastRunHealth,
        };
      }),
      recentRuns: recentRuns.map((run) => {
        const total = run.results.length;
        const passed = run.results.filter((r) => r.status === "PASSED").length;
        const failed = run.results.filter((r) => r.status === "FAILED").length;
        const blocked = run.results.filter(
          (r) => r.status === "BLOCKED",
        ).length;
        const skipped = run.results.filter(
          (r) => r.status === "SKIPPED",
        ).length;
        const untested = total - passed - failed - blocked - skipped;

        totalPassed += passed;
        totalExecuted += total - untested;

        return {
          id: run.id,
          title: run.title,
          status: run.status,
          createdAt: run.createdAt,
          project: run.project,
          metrics: { total, passed, failed, blocked, skipped, untested },
        };
      }),
      schedules,
      trendData: Array.from(trendMap.values()),
      heatmapData,
      auditLogs,
    };

    dashboardData.metrics.passRate =
      totalExecuted > 0 ? (totalPassed / totalExecuted) * 100 : 0;
  } catch (err) {
    console.error("Failed to fetch QA dashboard data:", err);
  }

  const {
    metrics,
    automation,
    projects,
    recentRuns,
    schedules,
    trendData,
    allProjectsForFilter,
    heatmapData,
    auditLogs,
  } = dashboardData;

  const totalAutomationCases =
    automation.automated + automation.manual + automation.toBeAutomated;
  const automatedPercent =
    totalAutomationCases > 0
      ? (automation.automated / totalAutomationCases) * 100
      : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background font-sans text-text-main">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-main tracking-tight">
                Global QA Dashboard
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                NOC Command Center: cross-project metrics, historical grids, and execution logs
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
              style={{
                background: "var(--primary)",
              }}
            >
              View all projects
            </Link>
          </div>

          {/* Interactive Filters Panel */}
          <DashboardToolbar projects={allProjectsForFilter} />

          {/* ── Stat cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Test Cases */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
              }}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Test Cases
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface/20 flex items-center justify-center">
                  <FileText size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {metrics.totalCases}
              </div>
              <div className="text-xs text-white/60 mt-1">
                {metrics.totalProjects} projects
              </div>
            </div>

            {/* Global Automation */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 4px 20px rgba(5,150,105,0.35)",
              }}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Automation
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface/20 flex items-center justify-center">
                  <ShieldCheck size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {automatedPercent.toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-surface/80 rounded-full"
                  style={{ width: `${automatedPercent}%` }}
                />
              </div>
            </div>

            {/* Total Test Runs */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
              }}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Test Runs
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface/20 flex items-center justify-center">
                  <PlayCircle size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {metrics.totalRuns}
              </div>
              <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                <TrendingUp size={11} /> Execution volume
              </div>
            </div>

            {/* Global Pass Rate */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{
                background: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)",
                boxShadow: "0 4px 20px rgba(219,39,119,0.35)",
              }}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Pass Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface/20 flex items-center justify-center">
                  <CheckCircle2 size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {metrics.passRate.toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-surface/80 rounded-full"
                  style={{ width: `${metrics.passRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Trend + Donut ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-surface rounded-2xl border border-border shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
                    <Activity
                      size={16}
                      className="text-indigo-500"
                      strokeWidth={2.5}
                    />
                    Execution Trends ({timeframeStr} days)
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Test results over the selected timeframe
                  </p>
                </div>
              </div>
              <div className="flex-1 p-5 min-h-[280px]">
                <ExecutionTrendChart data={trendData} />
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm flex flex-col">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
                  <ShieldCheck
                    size={16}
                    className="text-emerald-500"
                    strokeWidth={2.5}
                  />
                  Automation
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Coverage across all projects
                </p>
              </div>
              <div className="flex-1 p-5 flex flex-col items-center justify-center">
                <div className="relative w-full h-[200px]">
                  <AutomationDonutChart data={automation} />
                </div>
                <div className="w-full mt-4 space-y-1.5">
                  {[
                    {
                      label: "Automated",
                      value: automation.automated,
                      color: "#10b981",
                    },
                    {
                      label: "To Be Automated",
                      value: automation.toBeAutomated,
                      color: "#f59e0b",
                    },
                    {
                      label: "Manual",
                      value: automation.manual,
                      color: "#cbd5e1",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-xs font-semibold text-text-muted">
                          {label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-text-main bg-surface-hover px-2 py-0.5 rounded-md">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Quality Heatmap + Activity Logs Stream ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-1 lg:col-span-2">
              <QualityHeatmap heatmapData={heatmapData} />
            </div>
            <div className="col-span-1">
              <RecentActivityStream auditLogs={auditLogs} />
            </div>
          </div>

          {/* ── Bottom: Matrix + Executions ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProjectQualityMatrix projects={projects} />
            <div className="flex flex-col gap-4">
              <UpcomingSchedules schedules={schedules} />
              <RecentExecutionsTable recentRuns={recentRuns} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
