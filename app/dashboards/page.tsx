import React from "react";
import Link from "next/link";
import {
  FileText,
  PlayCircle,
  CheckCircle2,
  ShieldCheck,
  Folder,
  Activity,
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
import {
  WidgetCard,
  RankList,
  SegmentBar,
  KpiRibbon,
} from "./components/DashboardWidgets";

export const dynamic = "force-dynamic";

type TrendDatum = {
  date: string;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
};

type DashboardProject = {
  code: string;
  name: string;
  cases: number;
  runs: number;
  automated: number;
  lastRunHealth: number | null;
};

type RecentRun = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  project: { name: string; code: string };
  metrics: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    untested: number;
  };
};

type Schedule = {
  id: string;
  title: string;
  cron: string;
  project: { name: string; code: string };
};

type ProjectFilter = { code: string; name: string };

type HeatmapProject = {
  code: string;
  name: string;
  dailyHealth: Array<{
    date: string;
    passRate: number | null;
    totalRuns: number;
  }>;
};

type AuditLogEntry = {
  id: string;
  action: string;
  entity: string;
  details: string | null;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
  project: { name: string; code: string } | null;
};

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
    projects: [] as DashboardProject[],
    recentRuns: [] as RecentRun[],
    schedules: [] as Schedule[],
    trendData: [] as TrendDatum[],
    allProjectsForFilter: [] as ProjectFilter[],
    heatmapData: [] as HeatmapProject[],
    auditLogs: [] as AuditLogEntry[],
  };

  // ── Extra analytics widgets (computed below) ──
  let widgets = {
    topFailing: [] as Array<{ title: string; suite: string; failed: number; total: number }>,
    flaky: [] as Array<{ title: string; suite: string; passed: number; failed: number }>,
    openDefects: [] as Array<{ id: string; key: string; url: string; summary: string; severity: string | null; project: string }>,
    openDefectCount: 0,
    execByUser: [] as Array<{ name: string; count: number }>,
    runStatus: { ACTIVE: 0, COMPLETED: 0, ABORTED: 0 } as Record<string, number>,
    statusDist: { PASSED: 0, FAILED: 0, BLOCKED: 0, SKIPPED: 0, IN_PROGRESS: 0 } as Record<string, number>,
    avgDurationMs: 0,
    coverageBySuite: [] as Array<{ title: string; total: number; passRate: number }>,
    priorityDist: [] as Array<{ priority: string; count: number }>,
    envBreakdown: [] as Array<{ title: string; count: number }>,
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

    // ── Analytics widgets (one broad results fetch + a couple aggregates) ──
    const winStart = new Date();
    winStart.setDate(winStart.getDate() - timeframeDays);
    const runWindowWhere: any = {
      createdAt: { gte: winStart },
      ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
    };

    const windowResults = await prisma.testRunResult.findMany({
      where: { testRun: runWindowWhere },
      select: {
        status: true,
        assigneeId: true,
        assignee: { select: { name: true, email: true } },
        testCase: {
          select: {
            id: true,
            title: true,
            suite: { select: { title: true } },
          },
        },
      },
    });

    const windowRuns = await prisma.testRun.findMany({
      where: runWindowWhere,
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        environment: { select: { title: true } },
      },
    });

    const linkedIssues = await prisma.linkedIssue.findMany({
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        key: true,
        url: true,
        summary: true,
        status: true,
        severity: true,
        project: { select: { code: true } },
      },
    });

    const priorityGroups = await prisma.testCase.groupBy({
      by: ["priority"],
      where: projectCodeFilter ? { project: { code: projectCodeFilter } } : {},
      _count: { _all: true },
    });

    // status distribution
    const statusDist = { PASSED: 0, FAILED: 0, BLOCKED: 0, SKIPPED: 0, IN_PROGRESS: 0 } as Record<string, number>;
    // per-case + per-suite aggregation
    const caseAgg = new Map<string, { title: string; suite: string; passed: number; failed: number; total: number }>();
    const suiteAgg = new Map<string, { passed: number; total: number }>();
    const userAgg = new Map<string, { name: string; count: number }>();
    for (const r of windowResults) {
      if (r.status in statusDist) statusDist[r.status]++;
      const tc = r.testCase;
      if (tc) {
        const e = caseAgg.get(tc.id) || { title: tc.title, suite: tc.suite?.title || "No Suite", passed: 0, failed: 0, total: 0 };
        e.total++;
        if (r.status === "PASSED") e.passed++;
        if (r.status === "FAILED") e.failed++;
        caseAgg.set(tc.id, e);
        const sName = tc.suite?.title || "No Suite";
        const s = suiteAgg.get(sName) || { passed: 0, total: 0 };
        s.total++;
        if (r.status === "PASSED") s.passed++;
        suiteAgg.set(sName, s);
      }
      if (r.assigneeId) {
        const name = r.assignee?.name || r.assignee?.email?.split("@")[0] || "Unknown";
        const u = userAgg.get(r.assigneeId) || { name, count: 0 };
        u.count++;
        userAgg.set(r.assigneeId, u);
      }
    }

    const runStatus = { ACTIVE: 0, COMPLETED: 0, ABORTED: 0 } as Record<string, number>;
    const durations: number[] = [];
    const envAgg = new Map<string, number>();
    for (const r of windowRuns) {
      const k = r.status === "COMPLETED" ? "COMPLETED" : r.status === "ABORTED" ? "ABORTED" : "ACTIVE";
      runStatus[k]++;
      const dur = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime();
      if (dur > 0) durations.push(dur);
      const env = r.environment?.title || "Unspecified";
      envAgg.set(env, (envAgg.get(env) || 0) + 1);
    }

    const isOpen = (s: string | null) => !s || !/closed|done|resolved|fixed/i.test(s);
    const openDefectsList = linkedIssues.filter((i) => isOpen(i.status));

    widgets = {
      topFailing: [...caseAgg.values()]
        .filter((c) => c.failed > 0)
        .sort((a, b) => b.failed - a.failed)
        .slice(0, 6)
        .map((c) => ({ title: c.title, suite: c.suite, failed: c.failed, total: c.total })),
      flaky: [...caseAgg.values()]
        .filter((c) => c.passed > 0 && c.failed > 0)
        .sort((a, b) => Math.min(b.passed, b.failed) - Math.min(a.passed, a.failed))
        .slice(0, 6)
        .map((c) => ({ title: c.title, suite: c.suite, passed: c.passed, failed: c.failed })),
      openDefects: openDefectsList.slice(0, 6).map((i) => ({
        id: i.id,
        key: i.key,
        url: i.url,
        summary: i.summary,
        severity: i.severity,
        project: i.project.code,
      })),
      openDefectCount: openDefectsList.length,
      execByUser: [...userAgg.values()].sort((a, b) => b.count - a.count).slice(0, 6),
      runStatus,
      statusDist,
      avgDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      coverageBySuite: [...suiteAgg.entries()]
        .map(([title, v]) => ({ title, total: v.total, passRate: v.total ? Math.round((v.passed / v.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6),
      priorityDist: priorityGroups
        .map((g) => ({ priority: (g.priority as string) || "None", count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      envBreakdown: [...envAgg.entries()]
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    };

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
  const failedOrBlocked = recentRuns.reduce(
    (sum, run) => sum + run.metrics.failed + run.metrics.blocked,
    0,
  );
  const activeRuns = recentRuns.filter(
    (run) => run.status !== "COMPLETED" && run.metrics.untested > 0,
  ).length;

  const statCards: Array<{
    label: string;
    value: string;
    detail: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    tone: Tone;
    progress?: number;
  }> = [
    {
      label: "Test cases",
      value: metrics.totalCases.toLocaleString(),
      detail: `${metrics.totalProjects.toLocaleString()} projects tracked`,
      icon: FileText,
      tone: "indigo",
    },
    {
      label: "Automation",
      value: `${automatedPercent.toFixed(1)}%`,
      detail: `${automation.automated.toLocaleString()} automated cases`,
      icon: ShieldCheck,
      tone: "emerald",
      progress: automatedPercent,
    },
    {
      label: "Test runs",
      value: metrics.totalRuns.toLocaleString(),
      detail: `${activeRuns.toLocaleString()} active in queue or progress`,
      icon: PlayCircle,
      tone: "sky",
    },
    {
      label: "Pass rate",
      value: `${metrics.passRate.toFixed(1)}%`,
      detail:
        failedOrBlocked > 0
          ? `${failedOrBlocked.toLocaleString()} failed or blocked results`
          : "No recent failures detected",
      icon: CheckCircle2,
      tone:
        metrics.passRate >= 90
          ? "emerald"
          : metrics.passRate >= 70
            ? "amber"
            : "rose",
      progress: metrics.passRate,
    },
  ];

  const maxExec = Math.max(1, ...widgets.execByUser.map((u) => u.count));
  const maxPrio = Math.max(1, ...widgets.priorityDist.map((p) => p.count));
  const maxEnv = Math.max(1, ...widgets.envBreakdown.map((e) => e.count));
  const avgMin = Math.round(widgets.avgDurationMs / 60000);
  const avgDurationLabel =
    avgMin >= 60
      ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m`
      : `${avgMin}m`;
  const PRIORITY_COLOR: Record<string, string> = {
    HIGH: "#ef4444",
    CRITICAL: "#dc2626",
    MEDIUM: "#f59e0b",
    LOW: "#10b981",
    TRIVIAL: "#94a3b8",
    NONE: "#cbd5e1",
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background font-sans text-text-main selection:bg-primary/20">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 py-8 md:px-8">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[32px] md:text-[40px] font-black tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
                QA Dashboard
              </h1>
              <p className="text-[14px] font-medium text-text-muted mt-2">
                Cross-project quality, automation & execution risk ·{" "}
                {timeframeStr}-day window
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DashboardToolbar projects={allProjectsForFilter} />
              <Link
                href="/projects"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[14px] font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Folder size={16} /> Projects
              </Link>
            </div>
          </div>

          {/* Huge KPI Hero Block */}
          <KpiRibbon
            passRate={metrics.passRate}
            runs={metrics.totalRuns}
            activeRuns={activeRuns}
            automation={automatedPercent}
            automatedCount={automation.automated}
            cases={metrics.totalCases}
            projects={metrics.totalProjects}
            atRisk={failedOrBlocked}
          />

          {/* Main Analytics Bento (Asymmetric) */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left wide area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <WidgetCard title={`Execution Trends (${timeframeStr}d)`} hint="Passed & failed over time" borderless tinted>
                <div className="h-[280px]">
                  <ExecutionTrendChart data={trendData} />
                </div>
              </WidgetCard>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WidgetCard title="Result distribution" hint="Outcomes in window" borderless>
                  <SegmentBar
                    segments={[
                      { label: "Passed", value: widgets.statusDist.PASSED, color: "var(--emerald-500)" },
                      { label: "Failed", value: widgets.statusDist.FAILED, color: "var(--rose-500)" },
                      { label: "Blocked", value: widgets.statusDist.BLOCKED, color: "var(--amber-500)" },
                      { label: "Skipped", value: widgets.statusDist.SKIPPED, color: "var(--slate-400)" },
                      { label: "Untested", value: widgets.statusDist.IN_PROGRESS, color: "var(--slate-200)" },
                    ]}
                  />
                </WidgetCard>
                <WidgetCard title="Run status" hint="Runs in window" borderless>
                  <SegmentBar
                    segments={[
                      { label: "Active", value: widgets.runStatus.ACTIVE, color: "var(--indigo-500)" },
                      { label: "Completed", value: widgets.runStatus.COMPLETED, color: "var(--emerald-500)" },
                      { label: "Aborted", value: widgets.runStatus.ABORTED, color: "var(--rose-600)" },
                    ]}
                  />
                </WidgetCard>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <WidgetCard title="Avg run duration" hint="Across window" className="bg-primary/5 text-primary-800 dark:text-primary-300 dark:bg-primary/10 border-primary/20">
                <div className="flex flex-col items-center justify-center h-full py-6">
                  <div className="text-[48px] font-extrabold tracking-tighter leading-none">
                    {avgDurationLabel}
                  </div>
                  <div className="text-[13px] font-medium opacity-80 mt-2">
                    {metrics.totalRuns} runs · {activeRuns} active
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title="Automation coverage" hint="Manual vs automated" borderless>
                <div className="h-[200px]">
                  <AutomationDonutChart data={automation} />
                </div>
              </WidgetCard>
            </div>
          </section>

          {/* Attention / Risk Areas */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <WidgetCard title="Top failing cases" hint="Most failures in window" borderless>
              <RankList
                empty="No failures in this window"
                items={widgets.topFailing.map((c) => ({
                  label: c.title,
                  sub: c.suite,
                  value: `${c.failed}×`,
                  valueColor: "var(--rose-600)",
                }))}
              />
            </WidgetCard>
            <WidgetCard title="Flaky tests" hint="Mixed pass/fail history" borderless>
              <RankList
                empty="No flaky tests"
                items={widgets.flaky.map((c) => ({
                  label: c.title,
                  sub: c.suite,
                  value: `${c.passed}✓ / ${c.failed}✗`,
                  valueColor: "var(--amber-600)",
                }))}
              />
            </WidgetCard>
            <WidgetCard
              title="Open defects"
              hint="Linked issues still open"
              borderless
              right={
                <span className="text-[12px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                  {widgets.openDefectCount}
                </span>
              }
            >
              <RankList
                empty="No open defects 🎉"
                items={widgets.openDefects.map((d) => ({
                  label: d.key,
                  sub: d.summary,
                  href: d.url,
                  value: d.severity || d.project,
                  valueColor: "var(--rose-500)",
                }))}
              />
            </WidgetCard>
          </section>

          {/* Tables and Heatmap */}
          <section className="flex flex-col gap-6">
            <QualityHeatmap heatmapData={heatmapData} />
            
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-start mt-4">
              <div className="flex min-w-0 flex-col gap-6">
                <RecentExecutionsTable recentRuns={recentRuns} />
                <ProjectQualityMatrix projects={projects} />
              </div>
              <div className="flex min-w-0 flex-col gap-6">
                <RecentActivityStream auditLogs={auditLogs} />
                
                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WidgetCard title="Executions by tester" hint="Results recorded in window" borderless tinted>
                    <RankList
                      empty="No assigned executions"
                      items={widgets.execByUser.map((u) => ({
                        label: u.name,
                        value: u.count.toLocaleString(),
                        bar: (u.count / maxExec) * 100,
                        barColor: "var(--indigo-500)",
                      }))}
                    />
                  </WidgetCard>
                  <WidgetCard title="Coverage by suite" hint="Executed cases · pass rate" borderless tinted>
                    <RankList
                      empty="No executions"
                      items={widgets.coverageBySuite.map((s) => {
                        const col = s.passRate >= 80 ? "var(--emerald-500)" : s.passRate >= 50 ? "var(--amber-500)" : "var(--rose-500)";
                        return {
                          label: s.title,
                          sub: `${s.total} executed`,
                          value: `${s.passRate}%`,
                          valueColor: col,
                          bar: s.passRate,
                          barColor: col,
                        };
                      })}
                    />
                  </WidgetCard>
                </div>

                <UpcomingSchedules schedules={schedules} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OverviewItem({
  label,
  value,
  helper,
  tone = "slate",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "slate" | "rose" | "emerald";
}) {
  const valueTone =
    tone === "rose"
      ? "text-rose-600 dark:text-rose-300"
      : tone === "emerald"
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-text-main";

  return (
    <div className="border-t border-border px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <div className={`font-mono text-xl font-extrabold tabular-nums ${valueTone}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold text-text-muted">{label}</div>
      <div className="mt-0.5 text-xs text-text-muted/85">{helper}</div>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "rose" | "sky" | "indigo";
}) {
  const toneClass = {
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 dark:text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200 dark:text-amber-300",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200 dark:text-rose-300",
    sky: "border-sky-400/20 bg-sky-400/10 text-sky-200 dark:text-sky-300",
    indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200 dark:text-indigo-300",
  }[tone];

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-extrabold tabular-nums">
        {value}
      </div>
    </div>
  );
}

type Tone = "indigo" | "emerald" | "sky" | "amber" | "rose";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
  progress?: number;
}) {
  const toneClass = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    sky: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    rose: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  }[tone];
  const barClass = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-premium">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-xs font-bold uppercase text-text-muted">
            {label}
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-text-main">
            {value}
          </p>
        </div>
        <div className={`rounded-md border p-2 ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 min-h-5 text-sm font-medium text-text-muted">
        {detail}
      </p>
      {typeof progress === "number" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barClass}`}
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
      )}
    </article>
  );
}

function Panel({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-shadow duration-300 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/50 px-6 py-5 bg-surface-hover/30">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-text-main">
            <Icon size={17} className="text-primary" />
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-text-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
