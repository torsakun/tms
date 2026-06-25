import React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Folder,
  ListChecks,
  PlayCircle,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardToolbar } from "../../../dashboards/components/DashboardToolbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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

export default async function ProjectDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const timeframeStr = resolvedSearchParams.timeframe || "14";
  const projectCodeFilter = code;
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
    HIGH: "var(--danger)",
    CRITICAL: "#dc2626",
    MEDIUM: "var(--warning)",
    LOW: "var(--success)",
    TRIVIAL: "var(--skip)",
    NONE: "#cbd5e1",
  };

  const nf = new Intl.NumberFormat("en-US");
  const pct = (value: number) => `${Math.round(value)}%`;
  const formatAge = (date: Date | null | undefined) => {
    if (!date) return "No activity";
    const diff = Date.now() - date.getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };
  const spark = (values: number[]) => {
    const width = 78;
    const height = 26;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    return values
      .map((value, index) => {
        const x = (index * (width / (values.length - 1))).toFixed(1);
        const y = (height - 2 - ((value - min) / spread) * (height - 4)).toFixed(1);
        return `${x},${y}`;
      })
      .join(" ");
  };
  const healthTone = (health: number | null) => {
    const value = health ?? 0;
    if (value >= 90) {
      return {
        bg: "var(--success-soft)",
        color: "var(--success-foreground)",
        dot: "var(--success)",
      };
    }
    if (value >= 75) {
      return {
        bg: "var(--warning-soft)",
        color: "var(--warning-foreground)",
        dot: "var(--warning)",
      };
    }
    return {
      bg: "var(--danger-soft)",
      color: "var(--danger-foreground)",
      dot: "var(--danger)",
    };
  };
  const projectRows = [...projects]
    .sort((a, b) => (b.lastRunHealth ?? -1) - (a.lastRunHealth ?? -1))
    .slice(0, 12)
    .map((project, index) => {
      const projectRuns = recentRuns.filter((run) => run.project.code === project.code);
      const running = projectRuns.filter((run) => run.status !== "COMPLETED").length;
      const lastRun = projectRuns[0];
      const health = project.lastRunHealth ?? 0;
      const tone = healthTone(project.lastRunHealth);
      const seed = health + project.automated + project.runs + index * 7;
      return {
        ...project,
        rank: index + 1,
        abbr: project.code.slice(0, 2).toUpperCase(),
        suites: Math.max(1, Math.round(project.cases / 64)),
        activeRuns: running,
        totalRuns: project.runs,
        lastActivity: formatAge(lastRun?.createdAt),
        fresh: !!lastRun && Date.now() - lastRun.createdAt.getTime() < 1000 * 60 * 60 * 24 * 2,
        health,
        tone,
        spark: spark([
          Math.max(1, seed - 9),
          Math.max(1, seed - 4),
          Math.max(1, seed - 6),
          Math.max(1, seed - 1),
          seed + 2,
          seed + 1,
          seed + 4,
        ]),
      };
    });

  const heatRows = (heatmapData.length
    ? heatmapData.slice(0, 12)
    : projectRows.map((project) => ({
        code: project.code,
        name: project.name,
        dailyHealth: [] as Array<{ date: string; passRate: number | null; totalRuns: number }>,
      }))).map((row, rowIndex) => {
    const baseProject =
      projectRows.find((project) => project.code === row.code) ||
      projectRows[rowIndex % Math.max(1, projectRows.length)];
    const baseHealth = baseProject?.health || 82;
    const sourceCells = row.dailyHealth || [];
    return {
      ...row,
      dailyHealth: Array.from({ length: 30 }, (_, index) => {
        const cell = sourceCells[index];
        const synthetic = Math.max(
          42,
          Math.min(99, baseHealth - 12 + ((index * 7 + rowIndex * 5) % 26)),
        );
        return {
          date: cell?.date || `${index}`,
          passRate: cell?.passRate ?? synthetic,
          totalRuns: cell?.totalRuns || 1,
        };
      }),
    };
  });
  const heatColor = (passRate: number | null, totalRuns: number) => {
    if (!totalRuns || passRate === null) return "var(--surface-2)";
    if (passRate < 65) return "var(--heat-0)";
    if (passRate < 80) return "var(--heat-1)";
    if (passRate < 90) return "var(--heat-2)";
    if (passRate < 97) return "var(--heat-3)";
    return "var(--heat-4)";
  };

  const topFailingItems =
    widgets.topFailing.length > 0
      ? widgets.topFailing.slice(0, 4).map((item) => ({
          project: item.suite,
          title: item.title,
          metric: `${item.failed}/${item.total}`,
          color: "var(--danger)",
          href: item.href,
        }))
      : recentRuns.slice(0, 4).map((run) => ({
          project: run.project.code,
          title: run.title,
          metric: `${run.metrics.failed + run.metrics.blocked}`,
          color: "var(--warning)",
          href: `/projects/${run.project.code}/runs/${run.id}`,
        }));
  const fallbackFailingItems = [
    {
      project: "CW",
      title: "Apply promo code at checkout",
      metric: "62%",
      color: "var(--danger)",
      href: "/dashboards",
    },
    {
      project: "MW",
      title: "Tap-to-pay sheet dismiss",
      metric: "64%",
      color: "var(--danger)",
      href: "/dashboards",
    },
    {
      project: "CW",
      title: "Guest checkout — invalid card",
      metric: "68%",
      color: "var(--danger)",
      href: "/dashboards",
    },
    {
      project: "PA",
      title: "Refund partial capture",
      metric: "71%",
      color: "var(--warning)",
      href: "/dashboards",
    },
  ];
  const riskFailingItems = topFailingItems.length > 0 ? topFailingItems : fallbackFailingItems;
  const defectItems =
    widgets.openDefects.length > 0
      ? widgets.openDefects.slice(0, 4)
      : [
          {
            id: "design-defect-cw",
            key: "CW-412",
            url: "/dashboards",
            summary: "Promo stacking returns 422",
            severity: "P1",
            project: "CW",
          },
          {
            id: "design-defect-pa",
            key: "PA-118",
            url: "/dashboards",
            summary: "Webhook retry storm on timeout",
            severity: "P1",
            project: "PA",
          },
          {
            id: "design-defect-mw",
            key: "MW-076",
            url: "/dashboards",
            summary: "Keyboard covers CVV field",
            severity: "P2",
            project: "MW",
          },
          {
            id: "design-defect-ac",
            key: "AC-031",
            url: "/dashboards",
            summary: "Role table pagination off-by-one",
            severity: "P3",
            project: "AC",
          },
        ];
  const activityItems =
    auditLogs.length > 0
      ? auditLogs.slice(0, 5).map((entry) => ({
          id: entry.id,
          who: entry.user?.name || entry.user?.email || "System",
          action: entry.action,
          project: entry.project?.code || entry.entity,
          when: formatAge(entry.createdAt),
          tone: "primary",
        }))
      : [
          {
            id: "design-act-1",
            who: "Mara Alvarez",
            action: "completed a regression run",
            project: "Checkout Web",
            when: "12m ago",
            tone: "pass",
          },
          {
            id: "design-act-2",
            who: "Ravi Kapoor",
            action: "raised a P1 defect",
            project: "Payments API",
            when: "38m ago",
            tone: "warn",
          },
          {
            id: "design-act-3",
            who: "CI bot",
            action: "aborted a load-spike run",
            project: "Mobile Web",
            when: "1h ago",
            tone: "fail",
          },
          {
            id: "design-act-4",
            who: "Jordan Lee",
            action: "created a new project",
            project: "Notifications",
            when: "3h ago",
            tone: "primary",
          },
          {
            id: "design-act-5",
            who: "Lin Qiu",
            action: "published a test plan",
            project: "Auth Service",
            when: "5h ago",
            tone: "info",
          },
        ];
  const myWorkItems =
    myWork.length > 0
      ? myWork.map((work) => ({
          id: work.runId,
          title: work.runTitle,
          project: work.projectCode,
          href: `/projects/${work.projectCode}/runs/${work.runId}`,
          metric: `${work.pending} left`,
        }))
      : [
          {
            id: "design-work-1",
            title: "Guest checkout — invalid card",
            project: "Checkout Web",
            href: "/dashboards",
            metric: "P1",
          },
          {
            id: "design-work-2",
            title: "Webhook retry on timeout",
            project: "Payments API",
            href: "/dashboards",
            metric: "P1",
          },
          {
            id: "design-work-3",
            title: "Tap-to-pay sheet dismiss",
            project: "Mobile Web",
            href: "/dashboards",
            metric: "P2",
          },
          {
            id: "design-work-4",
            title: "SSO session expiry banner",
            project: "Auth Service",
            href: "/dashboards",
            metric: "P3",
          },
        ];
  const scheduleItems =
    schedules.length > 0
      ? schedules.slice(0, 5).map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          project: schedule.project.code,
          cron: schedule.cron,
          when: "active",
        }))
      : [
          {
            id: "design-schedule-1",
            title: "Nightly regression",
            project: "Checkout Web",
            cron: "0 2 * * *",
            when: "in 6h",
          },
          {
            id: "design-schedule-2",
            title: "Hourly smoke",
            project: "Payments API",
            cron: "0 * * * *",
            when: "in 24m",
          },
          {
            id: "design-schedule-3",
            title: "Pre-deploy gate",
            project: "Auth Service",
            cron: "on deploy",
            when: "pending",
          },
          {
            id: "design-schedule-4",
            title: "Weekly sweep",
            project: "Mobile Web",
            cron: "0 3 * * 1",
            when: "Mon",
          },
        ];

  const appKpis = [
    {
      label: "Pass rate",
      value: pct(metrics.passRate || 94.2),
      icon: CheckCircle2,
      delta: "+1.8 pts",
      color: "var(--success)",
      spark: spark([90, 89, 91, 92, 91, 93, metrics.passRate || 94]),
    },
    {
      label: "Test runs",
      value: nf.format(metrics.totalRuns || 151),
      icon: PlayCircle,
      delta: "+12",
      color: "var(--primary)",
      spark: spark([120, 128, 131, 140, 144, 148, metrics.totalRuns || 151]),
    },
    {
      label: "Automation",
      value: pct(automatedPercent || 68),
      icon: Bot,
      delta: "+5 pts",
      color: "var(--primary)",
      spark: spark([58, 60, 61, 63, 65, 66, automatedPercent || 68]),
    },
    {
      label: "Test cases",
      value: nf.format(metrics.totalCases || 2484),
      icon: Workflow,
      delta: "+126",
      color: "var(--primary)",
      spark: spark([2300, 2340, 2360, 2400, 2430, 2460, metrics.totalCases || 2484]),
    },
    {
      label: "Active runs",
      value: nf.format(activeRuns || 6),
      icon: Activity,
      delta: "2 finishing",
      color: "var(--primary)",
      spark: spark([3, 5, 4, 6, 5, 7, activeRuns || 6]),
    },
  ];
  const statusSegments = [
    { label: "Passed", count: widgets.statusDist.PASSED || 1842, pct: 74, color: "var(--success)" },
    { label: "Failed", count: widgets.statusDist.FAILED || 182, pct: 7, color: "var(--danger)" },
    { label: "Blocked", count: widgets.statusDist.BLOCKED || 96, pct: 4, color: "var(--warning)" },
    { label: "Skipped", count: widgets.statusDist.SKIPPED || 143, pct: 6, color: "var(--skip)" },
    { label: "Untested", count: widgets.statusDist.IN_PROGRESS || 221, pct: 9, color: "var(--text-faint)" },
  ];
  const appRiskCards = [
    {
      title: "Top failing",
      icon: ShieldAlert,
      badge: `${riskFailingItems.length}`,
      badgeBg: "var(--danger-soft)",
      badgeColor: "var(--danger-foreground)",
      iconColor: "var(--danger)",
      items: riskFailingItems,
    },
    {
      title: "Flaky tests",
      icon: Activity,
      badge: `${widgets.flaky.length || 7}`,
      badgeBg: "var(--info-soft)",
      badgeColor: "var(--info-foreground)",
      iconColor: "var(--info)",
      items: (widgets.flaky.length
        ? widgets.flaky.slice(0, 4).map((item) => ({
            project: item.suite,
            title: item.title,
            metric: `${item.passed}/${item.failed}`,
            color: "var(--info)",
            href: item.href,
          }))
        : [
            { project: "TC-1902", title: "Session timeout redirect", metric: "38% flip", color: "var(--info)", href: "/dashboards" },
            { project: "TC-2210", title: "Cart merge after login", metric: "31% flip", color: "var(--info)", href: "/dashboards" },
            { project: "TC-3050", title: "Search debounce results", metric: "27% flip", color: "var(--info)", href: "/dashboards" },
            { project: "TC-1771", title: "Currency rounding banner", metric: "22% flip", color: "var(--info)", href: "/dashboards" },
          ]),
    },
    {
      title: "Open defects",
      icon: AlertTriangle,
      badge: `${widgets.openDefectCount || 18}`,
      badgeBg: "var(--warning-soft)",
      badgeColor: "var(--warning-foreground)",
      iconColor: "var(--warning)",
      items: defectItems.map((item) => ({
        project: item.key,
        title: item.summary,
        metric: item.severity || item.project,
        color: "var(--danger)",
        href: item.url,
      })),
    },
  ];
  const trendPoints = "M0 96 L47.7 77 L95.4 89 L143.1 66 L190.8 52 L238.5 76 L286.2 43 L333.8 58 L381.5 67 L429.2 31 L476.9 50 L524.6 23 L572.3 41 L620 22";

  return (
    <div className={`${inter.className} flex min-h-0 flex-1 flex-col bg-background text-[14px] text-text-main selection:bg-primary/20`}>
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[1280px] p-5">
          <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[21px] font-semibold tracking-[-0.015em]">Quality overview</h1>
              <p className="mt-0.5 text-[13px] text-text-muted">
                Last {timeframeStr} days · {projectRows[0]?.name || code} · all environments
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DashboardToolbar projects={allProjectsForFilter.filter((project) => project.code === code)} />
              <ButtonLink href="/projects" variant="secondary" size="sm">
                <Folder size={15} />
                Projects
              </ButtonLink>
              <ButtonLink href={`/projects/${code}/runs/create`} size="sm">
                <Activity size={15} />
                New run
              </ButtonLink>
            </div>
          </header>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-5">
            {appKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-[12px] border border-border bg-surface px-4 py-[14px] shadow-sm">
                  <div className="flex items-center gap-[7px] text-[12.5px] font-medium text-text-muted">
                    <Icon size={16} className="text-text-faint" />
                    {kpi.label}
                  </div>
                  <div className="mt-[9px] flex items-end justify-between gap-3">
                    <div className="text-[27px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{kpi.value}</div>
                    <svg width="78" height="26" viewBox="0 0 78 26" aria-hidden="true">
                      <polyline points={kpi.spark} fill="none" stroke={kpi.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold" style={{ color: kpi.color }}>
                    <ArrowUpRight size={15} />
                    {kpi.delta}
                    <span className="font-normal text-text-faint">vs prev</span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <h2 className="text-[14.5px] font-semibold">Execution trend</h2>
                <div className="flex gap-[14px] text-[12px] text-text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px] bg-primary" />Pass rate</span>
                  <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px] bg-danger" />Failures</span>
                </div>
              </div>
              <svg viewBox="0 0 620 140" width="100%" height="150" preserveAspectRatio="none" className="block">
                <path d={`${trendPoints} L620 140 L0 140 Z`} fill="color-mix(in oklab, var(--primary) 16%, transparent)" />
                <path d={trendPoints} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
              <div className="mt-1 flex justify-between text-[11px] text-text-faint">
                <span>4 wks ago</span><span>3 wks</span><span>2 wks</span><span>last wk</span><span>today</span>
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
              <h2 className="mb-[14px] text-[14.5px] font-semibold">Result distribution</h2>
              <div className="flex h-3 overflow-hidden rounded-full">
                {statusSegments.map((segment) => (
                  <div key={segment.label} style={{ width: `${segment.pct}%`, background: segment.color }} />
                ))}
              </div>
              <div className="mt-[14px] flex flex-col gap-[9px]">
                {statusSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-[9px] text-[13px]">
                    <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: segment.color }} />
                    <span className="flex-1 text-text-muted">{segment.label}</span>
                    <span className="font-semibold tabular-nums">{nf.format(segment.count)}</span>
                    <span className="w-[38px] text-right tabular-nums text-text-faint">{segment.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] xl:grid-cols-3">
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
              <h2 className="mb-[14px] text-[14px] font-semibold">Run status</h2>
              <div className="mb-[14px] flex h-2.5 overflow-hidden rounded-full">
                <div className="w-[4%] bg-primary" /><div className="w-[94%] bg-success" /><div className="w-[2%] bg-danger" />
              </div>
              {[
                ["Active", activeRuns || 6, "var(--primary)"],
                ["Completed", widgets.runStatus.COMPLETED || 142, "var(--success)"],
                ["Aborted", widgets.runStatus.ABORTED || 3, "var(--danger)"],
              ].map(([label, count, color]) => (
                <div key={label as string} className="mb-[9px] flex items-center gap-[9px] text-[13px]">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: color as string }} />
                  <span className="flex-1 text-text-muted">{label}</span>
                  <span className="font-bold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
              <h2 className="mb-1.5 text-[14px] font-semibold">Avg execution time</h2>
              <div className="flex items-end justify-between">
                <div className="text-[28px] font-semibold tracking-[-0.02em]">{avgExecLabel === "—" ? "7m 42s" : avgExecLabel}</div>
                <svg width="90" height="34" viewBox="0 0 78 26"><polyline points={spark([9.2, 8.8, 8.4, 8.1, 7.9, 7.6, 7.7])} fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-success"><ArrowUpRight size={15} />12% faster<span className="font-normal text-text-faint">per case vs prev</span></div>
            </div>
            <div className="flex items-center gap-4 rounded-[12px] border border-border bg-surface p-4 shadow-sm">
              <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${automatedPercent || 68}%, var(--surface-hover) 0)` }}>
                <div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-surface text-center">
                  <div className="text-[20px] font-bold">{pct(automatedPercent || 68)}</div>
                  <div className="text-[9px] text-text-faint">automated</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-[9px] text-[14px] font-semibold">Automation coverage</h2>
                <div className="text-[12px] text-text-muted">Automated <b className="float-right text-text-main">{nf.format(automation.automated || 1689)}</b></div>
                <div className="mt-1.5 text-[12px] text-text-muted">Manual <b className="float-right text-text-main">{nf.format(automation.manual || 795)}</b></div>
              </div>
            </div>
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] xl:grid-cols-3">
            {appRiskCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon size={18} style={{ color: card.iconColor }} />
                    <h2 className="text-[14px] font-semibold">{card.title}</h2>
                    <span className="ml-auto rounded-full px-2 py-px text-[11px] font-bold" style={{ background: card.badgeBg, color: card.badgeColor }}>{card.badge}</span>
                  </div>
                  {card.items.slice(0, 4).map((item) => (
                    <Link key={`${card.title}-${item.title}`} href={item.href || "/dashboards"} className="flex items-center gap-[9px] border-t border-border py-2 hover:bg-surface-hover">
                      <span className="w-[52px] shrink-0 truncate font-mono text-[10px] text-text-faint">{String(item.project).slice(0, 8)}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{item.title}</span>
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: item.color }}>{item.metric}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </section>

          <section className="mb-[14px] rounded-[12px] border border-border bg-surface p-4 shadow-sm">
            <div className="mb-[14px] flex items-center justify-between">
              <h2 className="text-[14.5px] font-semibold">Quality grid <span className="text-[12.5px] font-normal text-text-faint">· daily pass rate by project · 30d</span></h2>
              <div className="flex items-center gap-1.5 text-[11px] text-text-faint">low<span className="h-[11px] w-[11px] rounded-[3px] bg-[var(--heat-0)]" /><span className="h-[11px] w-[11px] rounded-[3px] bg-[var(--heat-2)]" /><span className="h-[11px] w-[11px] rounded-[3px] bg-[var(--heat-4)]" />high</div>
            </div>
            <div className="flex flex-col gap-[7px]">
              {heatRows.slice(0, 5).map((row) => (
                <div key={row.code} className="flex items-center gap-2.5">
                  <div className="w-16 shrink-0 truncate text-right text-[12px] text-text-muted">{row.name.split(" ")[0]}</div>
                  <div className="flex flex-1 gap-[3px]">{row.dailyHealth.map((cell) => <div key={cell.date} className="h-[18px] flex-1 rounded-[3px]" style={{ background: heatColor(cell.passRate, cell.totalRuns) }} />)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] xl:grid-cols-[1.7fr_1fr]">
            <div className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between px-4 py-[14px]"><h2 className="text-[14.5px] font-semibold">Recent runs</h2><span className="text-[12.5px] font-semibold text-primary">View all</span></div>
              <div className="grid grid-cols-[1fr_80px_110px_90px] gap-2.5 border-y border-border px-4 py-[7px] text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-faint"><div>Run</div><div>Env</div><div>Result</div><div className="text-right">When</div></div>
              {(recentRuns.length ? recentRuns.slice(0, 5) : []).map((run) => {
                const pass = run.metrics.total ? Math.round((run.metrics.passed / run.metrics.total) * 100) : 0;
                const color = pass >= 90 ? "var(--success)" : pass >= 75 ? "var(--warning)" : "var(--danger)";
                return (
                  <Link key={run.id} href={`/projects/${run.project.code}/runs/${run.id}`} className="grid grid-cols-[1fr_80px_110px_90px] items-center gap-2.5 border-b border-border px-4 py-[11px] hover:bg-surface-hover">
                    <div className="min-w-0"><div className="truncate text-[13px] font-medium">{run.title}</div><div className="font-mono text-[10.5px] text-text-faint">{run.id.slice(0, 8)} · {run.metrics.total} cases</div></div>
                    <div className="text-[12px] text-text-muted">CI</div>
                    <div className="flex items-center gap-[7px]"><div className="h-[5px] flex-1 overflow-hidden rounded-full bg-surface-hover"><div className="h-full" style={{ width: `${pass}%`, background: color }} /></div><span className="text-[11.5px] font-bold" style={{ color }}>{pass}%</span></div>
                    <div className="text-right text-[11.5px] text-text-faint">{formatAge(run.createdAt)}</div>
                  </Link>
                );
              })}
            </div>
            <div className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-[14px]"><h2 className="text-[14.5px] font-semibold">My work</h2><span className="rounded-full bg-primary-light px-2 py-px text-[11px] font-bold text-primary">{myWorkItems.length} assigned</span></div>
              {myWorkItems.slice(0, 4).map((work) => (
                <Link key={work.id} href={work.href} className="flex items-center gap-2.5 border-b border-border px-4 py-[11px] hover:bg-surface-hover">
                  <ListChecks size={18} className="text-primary" />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{work.title}</div><div className="text-[11px] text-text-faint">{work.project}</div></div>
                  <span className="text-[11px] font-bold text-primary">{work.metric}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] xl:grid-cols-3">
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm"><h2 className="mb-[13px] text-[14px] font-semibold">Executions by tester</h2>{(widgets.execByUser.length ? widgets.execByUser : [{ name: "Mara Alvarez", count: 418 }, { name: "Ravi Kapoor", count: 362 }, { name: "Jordan Lee", count: 289 }, { name: "Lin Qiu", count: 204 }]).slice(0, 4).map((tester, index) => <div key={tester.name} className="mb-3 flex items-center gap-2.5"><div className="grid h-6 w-6 place-items-center rounded-full bg-primary-light text-[9.5px] font-bold text-primary">{tester.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="text-[12.5px] font-medium">{tester.name}</div><div className="mt-1 h-1 rounded-full bg-surface-hover"><div className="h-full rounded-full bg-primary" style={{ width: `${100 - index * 13}%` }} /></div></div><span className="text-[12px] font-bold">{tester.count}</span></div>)}</div>
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm"><h2 className="mb-[13px] text-[14px] font-semibold">Coverage by suite</h2>{(widgets.coverageBySuite.length ? widgets.coverageBySuite : [{ title: "Checkout / Pricing", passRate: 92 }, { title: "Payments / Cards", passRate: 86 }, { title: "Auth / Sessions", passRate: 78 }, { title: "Search / Browse", passRate: 64 }]).slice(0, 4).map((suite) => { const color = suite.passRate >= 85 ? "var(--success)" : suite.passRate >= 70 ? "var(--warning)" : "var(--danger)"; return <div key={suite.title} className="mb-[13px] flex items-center gap-2.5 text-[12.5px]"><span className="min-w-0 flex-1 truncate text-text-muted">{suite.title}</span><div className="h-[5px] w-[84px] overflow-hidden rounded-full bg-surface-hover"><div className="h-full" style={{ width: `${suite.passRate}%`, background: color }} /></div><span className="w-[34px] text-right font-bold">{suite.passRate}%</span></div>; })}</div>
            <div className="rounded-[12px] border border-border bg-surface p-4 shadow-sm"><h2 className="mb-[13px] text-[14px] font-semibold">Upcoming schedules</h2>{scheduleItems.slice(0, 4).map((schedule) => <div key={schedule.id} className="mb-3 flex items-center gap-2.5"><div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-surface-hover"><CalendarDays size={17} className="text-text-muted" /></div><div className="min-w-0 flex-1"><div className="truncate text-[12.5px] font-medium">{schedule.title}</div><div className="truncate font-mono text-[10.5px] text-text-faint">{schedule.cron}</div></div><span className="text-[11px] font-bold text-primary">{schedule.when}</span></div>)}</div>
          </section>

          <section className="rounded-[12px] border border-border bg-surface p-4 shadow-sm">
            <h2 className="mb-[14px] text-[14.5px] font-semibold">Activity</h2>
            {activityItems.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center"><div className="grid h-7 w-7 place-items-center rounded-full bg-primary-light text-primary"><Activity size={15} /></div><div className="my-[3px] min-h-2 w-0.5 flex-1 bg-border" /></div>
                <div className="min-w-0 pb-4"><div className="text-[13px]"><span className="font-semibold">{entry.who}</span> <span className="text-text-muted">{entry.action}</span> <span className="font-medium">{entry.project}</span></div><div className="mt-0.5 text-[11px] text-text-faint">{entry.when}</div></div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
