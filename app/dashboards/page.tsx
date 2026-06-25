import React from "react";
import { Folder, ListChecks } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    topFailing: [] as Array<{ title: string; suite: string; failed: number; total: number; href: string }>,
    flaky: [] as Array<{ title: string; suite: string; passed: number; failed: number; href: string }>,
    openDefects: [] as Array<{ id: string; key: string; url: string; summary: string; severity: string | null; project: string }>,
    openDefectCount: 0,
    execByUser: [] as Array<{ name: string; count: number }>,
    runStatus: { ACTIVE: 0, COMPLETED: 0, ABORTED: 0 } as Record<string, number>,
    statusDist: { PASSED: 0, FAILED: 0, BLOCKED: 0, SKIPPED: 0, IN_PROGRESS: 0 } as Record<string, number>,
    avgExecMs: 0,
    execCount: 0,
    coverageBySuite: [] as Array<{ title: string; total: number; passRate: number; href: string }>,
    priorityDist: [] as Array<{ priority: string; count: number }>,
    envBreakdown: [] as Array<{ title: string; count: number }>,
  };

  // "My work" — runs with cases still assigned to the current user to execute.
  let myWork = [] as Array<{
    runId: string;
    runTitle: string;
    projectCode: string;
    pending: number;
  }>;
  let myPendingTotal = 0;

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

    // Bucket by the day each result was actually executed (updatedAt), not the
    // run's creation date — so a run created earlier but executed today moves
    // today's bar.
    const trendResults = await prisma.testRunResult.findMany({
      where: {
        updatedAt: { gte: trendStartDate },
        status: { not: "IN_PROGRESS" },
        ...(projectCodeFilter
          ? { testRun: { project: { code: projectCodeFilter } } }
          : {}),
      },
      select: { status: true, updatedAt: true },
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

    for (const res of trendResults) {
      const dateStr = new Date(res.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const item = trendMap.get(dateStr);
      if (item) {
        if (res.status === "PASSED") item.passed++;
        if (res.status === "FAILED") item.failed++;
        if (res.status === "BLOCKED") item.blocked++;
        if (res.status === "SKIPPED") item.skipped++;
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

    const projectDaysMap = new Map<string, Map<string, { passed: number, total: number, runs: number }>>();
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
        dayMap.set(dateStr, { passed: 0, total: 0, runs: 0 });
      }
      const dayStats = dayMap.get(dateStr)!;
      dayStats.runs++;
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
          totalRuns: stats ? stats.runs : 0,
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
        timeSpent: true,
        assignee: { select: { name: true, email: true } },
        testCase: {
          select: {
            id: true,
            title: true,
            project: { select: { code: true } },
            suite: { select: { id: true, title: true } },
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
    const caseAgg = new Map<string, { id: string; code: string; title: string; suite: string; passed: number; failed: number; total: number }>();
    const suiteAgg = new Map<string, { id: string; code: string; title: string; passed: number; total: number }>();
    const userAgg = new Map<string, { name: string; count: number }>();
    const execTimes: number[] = []; // real per-result execution time (ms)
    for (const r of windowResults) {
      if (r.status in statusDist) statusDist[r.status]++;
      if (typeof r.timeSpent === "number" && r.timeSpent > 0)
        execTimes.push(r.timeSpent);
      const tc = r.testCase;
      if (tc) {
        const e = caseAgg.get(tc.id) || { id: tc.id, code: tc.project?.code || "", title: tc.title, suite: tc.suite?.title || "No Suite", passed: 0, failed: 0, total: 0 };
        e.total++;
        if (r.status === "PASSED") e.passed++;
        if (r.status === "FAILED") e.failed++;
        caseAgg.set(tc.id, e);
        const sKey = tc.suite?.id || "none";
        const s = suiteAgg.get(sKey) || { id: tc.suite?.id || "", code: tc.project?.code || "", title: tc.suite?.title || "No Suite", passed: 0, total: 0 };
        s.total++;
        if (r.status === "PASSED") s.passed++;
        suiteAgg.set(sKey, s);
      }
      if (r.assigneeId) {
        const name = r.assignee?.name || r.assignee?.email?.split("@")[0] || "Unknown";
        const u = userAgg.get(r.assigneeId) || { name, count: 0 };
        u.count++;
        userAgg.set(r.assigneeId, u);
      }
    }

    const runStatus = { ACTIVE: 0, COMPLETED: 0, ABORTED: 0 } as Record<string, number>;
    const envAgg = new Map<string, number>();
    for (const r of windowRuns) {
      const k = r.status === "COMPLETED" ? "COMPLETED" : r.status === "ABORTED" ? "ABORTED" : "ACTIVE";
      runStatus[k]++;
      const env = r.environment?.title || "Unspecified";
      envAgg.set(env, (envAgg.get(env) || 0) + 1);
    }

    const isOpen = (s: string | null) => !s || !/closed|done|resolved|fixed/i.test(s);
    const openDefectsList = linkedIssues.filter((i) => isOpen(i.status));

    const caseHref = (c: { code: string; id: string }) =>
      c.code ? `/projects/${c.code}/cases/${c.id}/edit` : "";
    const suiteHref = (s: { code: string; id: string }) =>
      s.code && s.id ? `/projects/${s.code}/repository?suite=${s.id}` : "";

    widgets = {
      topFailing: [...caseAgg.values()]
        .filter((c) => c.failed > 0)
        .sort((a, b) => b.failed - a.failed)
        .slice(0, 6)
        .map((c) => ({ title: c.title, suite: c.suite, failed: c.failed, total: c.total, href: caseHref(c) })),
      flaky: [...caseAgg.values()]
        .filter((c) => c.passed > 0 && c.failed > 0)
        .sort((a, b) => Math.min(b.passed, b.failed) - Math.min(a.passed, a.failed))
        .slice(0, 6)
        .map((c) => ({ title: c.title, suite: c.suite, passed: c.passed, failed: c.failed, href: caseHref(c) })),
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
      avgExecMs: execTimes.length ? execTimes.reduce((a, b) => a + b, 0) / execTimes.length : 0,
      execCount: execTimes.length,
      coverageBySuite: [...suiteAgg.values()]
        .map((v) => ({ title: v.title, total: v.total, passRate: v.total ? Math.round((v.passed / v.total) * 100) : 0, href: suiteHref(v) }))
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

    // ── My work: cases still assigned to me to execute (untested) ──
    const session = await getServerSession(authOptions);
    const myId = (session?.user as any)?.id as string | undefined;
    if (myId) {
      const myPending = await prisma.testRunResult.findMany({
        where: {
          assigneeId: myId,
          status: "IN_PROGRESS",
          testRun: {
            status: "ACTIVE",
            ...(projectCodeFilter ? { project: { code: projectCodeFilter } } : {}),
          },
        },
        select: {
          testRun: {
            select: { id: true, title: true, project: { select: { code: true } } },
          },
        },
      });
      myPendingTotal = myPending.length;
      const runMap = new Map<string, { runId: string; runTitle: string; projectCode: string; pending: number }>();
      for (const r of myPending) {
        const run = r.testRun;
        if (!run) continue;
        const e = runMap.get(run.id) || {
          runId: run.id,
          runTitle: run.title,
          projectCode: run.project.code,
          pending: 0,
        };
        e.pending++;
        runMap.set(run.id, e);
      }
      myWork = [...runMap.values()].sort((a, b) => b.pending - a.pending).slice(0, 6);
    }

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


  const maxExec = Math.max(1, ...widgets.execByUser.map((u) => u.count));
  const maxPrio = Math.max(1, ...widgets.priorityDist.map((p) => p.count));
  const maxEnv = Math.max(1, ...widgets.envBreakdown.map((e) => e.count));
  // Real per-execution time from result.timeSpent (ms), not run wall-clock.
  const avgExecSec = widgets.avgExecMs / 1000;
  const avgExecLabel =
    widgets.execCount === 0
      ? "—"
      : avgExecSec >= 60
        ? `${Math.floor(avgExecSec / 60)}m ${Math.round(avgExecSec % 60)}s`
        : `${Math.round(avgExecSec)}s`;
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
              <ButtonLink
                href="/projects"
                className="shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Folder size={16} /> Projects
              </ButtonLink>
            </div>
          </div>

          {/* My work — what's assigned to me to execute */}
          {myWork.length > 0 && (
            <WidgetCard
              title="My work"
              hint={`${myPendingTotal} case${myPendingTotal === 1 ? "" : "s"} assigned to you, across ${myWork.length} active run${myWork.length === 1 ? "" : "s"}`}
              right={
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                  <ListChecks size={13} /> {myPendingTotal} to test
                </span>
              }
            >
              <RankList
                empty="Nothing assigned to you"
                items={myWork.map((w) => ({
                  label: w.runTitle,
                  sub: w.projectCode,
                  href: `/projects/${w.projectCode}/runs/${w.runId}`,
                  value: `${w.pending} left`,
                  valueColor: "var(--indigo-500)",
                }))}
              />
            </WidgetCard>
          )}

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
              <WidgetCard title="Avg execution time" hint="Per test result, in window" className="bg-primary/5 text-primary-800 dark:text-primary-300 dark:bg-primary/10 border-primary/20">
                <div className="flex flex-col items-center justify-center h-full py-6">
                  <div className="text-[48px] font-extrabold tracking-tighter leading-none">
                    {avgExecLabel}
                  </div>
                  <div className="text-[13px] font-medium opacity-80 mt-2">
                    {widgets.execCount.toLocaleString()} timed executions
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
                  href: c.href || undefined,
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
                  href: c.href || undefined,
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
                          href: s.href || undefined,
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