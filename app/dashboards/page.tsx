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
  Clock
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ExecutionTrendChart, AutomationDonutChart } from "./components/DashboardCharts";
import { ProjectQualityMatrix } from "./components/ProjectQualityMatrix";
import { RecentExecutionsTable } from "./components/RecentExecutionsTable";
import { UpcomingSchedules } from "./components/UpcomingSchedules";

export const dynamic = "force-dynamic";

export default async function GlobalDashboardPage() {
  let dashboardData = {
    metrics: { totalProjects: 0, totalCases: 0, totalRuns: 0, passRate: 0 },
    automation: { automated: 0, manual: 0, toBeAutomated: 0 },
    projects: [] as any[],
    recentRuns: [] as any[],
    schedules: [] as any[],
    trendData: [] as any[]
  };

  try {
    const totalProjects = await prisma.project.count();
    const totalCases = await prisma.testCase.count();
    const totalRuns = await prisma.testRun.count();

    const automatedCasesCount = await prisma.testCase.count({ where: { automationStatus: "AUTOMATED" } });
    const manualCasesCount = await prisma.testCase.count({ where: { automationStatus: "MANUAL" } });
    const toBeAutomatedCount = await prisma.testCase.count({ where: { automationStatus: "TO_BE_AUTOMATED" } });

    // Project Quality Matrix Data
    const projectsList = await prisma.project.findMany({
      include: {
        _count: { select: { testCases: true, testRuns: true } },
        testCases: { select: { automationStatus: true } },
        testRuns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { results: { select: { status: true } } }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 50
    });

    // Recent Runs Table Data
    const recentRuns = await prisma.testRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { 
        results: { select: { status: true } },
        project: { select: { name: true, code: true } }
      }
    });

    // Pipeline Schedules
    const schedules = await prisma.pipelineSchedule.findMany({
      where: { isActive: true },
      include: { project: { select: { name: true, code: true } } },
      orderBy: { createdAt: "asc" }
    });

    // Fetch Trend Data for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const trendRuns = await prisma.testRun.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      include: { results: { select: { status: true } } },
      orderBy: { createdAt: 'asc' }
    });

    // Group by Date
    const trendMap = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      trendMap.set(dateStr, { date: dateStr, passed: 0, failed: 0, blocked: 0, skipped: 0 });
    }

    for (const run of trendRuns) {
      const dateStr = new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (trendMap.has(dateStr)) {
        const item = trendMap.get(dateStr);
        run.results.forEach(res => {
          if (res.status === "PASSED") item.passed++;
          if (res.status === "FAILED") item.failed++;
          if (res.status === "BLOCKED") item.blocked++;
          if (res.status === "SKIPPED") item.skipped++;
        });
      }
    }

    let totalPassed = 0;
    let totalExecuted = 0;

    dashboardData = {
      metrics: {
        totalProjects,
        totalCases,
        totalRuns,
        passRate: 0
      },
      automation: {
        automated: automatedCasesCount,
        manual: manualCasesCount,
        toBeAutomated: toBeAutomatedCount
      },
      projects: projectsList.map(p => {
        const automated = p.testCases.filter(tc => tc.automationStatus === "AUTOMATED").length;
        const total = p.testCases.length;
        const autoPercent = total > 0 ? (automated / total) * 100 : 0;
        
        let lastRunHealth = null;
        if (p.testRuns.length > 0) {
          const run = p.testRuns[0];
          const passed = run.results.filter(r => r.status === "PASSED").length;
          const runTotal = run.results.length;
          lastRunHealth = runTotal > 0 ? (passed / runTotal) * 100 : null;
        }

        return {
          code: p.code,
          name: p.name,
          cases: total,
          runs: p._count.testRuns,
          automated: autoPercent,
          lastRunHealth
        }
      }),
      recentRuns: recentRuns.map(run => {
        const total = run.results.length;
        const passed = run.results.filter(r => r.status === "PASSED").length;
        const failed = run.results.filter(r => r.status === "FAILED").length;
        const blocked = run.results.filter(r => r.status === "BLOCKED").length;
        const skipped = run.results.filter(r => r.status === "SKIPPED").length;
        const untested = total - passed - failed - blocked - skipped;
        
        totalPassed += passed;
        totalExecuted += (total - untested);

        return { 
          id: run.id, 
          title: run.title, 
          status: run.status, 
          createdAt: run.createdAt, 
          project: run.project,
          metrics: { total, passed, failed, blocked, skipped, untested } 
        };
      }),
      schedules,
      trendData: Array.from(trendMap.values())
    };
    
    dashboardData.metrics.passRate = totalExecuted > 0 ? (totalPassed / totalExecuted) * 100 : 0;
    
  } catch (err) {
    console.error("Failed to fetch QA dashboard data:", err);
  }

  const { metrics, automation, projects, recentRuns, schedules, trendData } = dashboardData;
  const totalAutomationCases = automation.automated + automation.manual + automation.toBeAutomated;
  const automatedPercent = totalAutomationCases > 0 ? (automation.automated / totalAutomationCases) * 100 : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background font-sans text-text-main">

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
              <p className="text-xs text-slate-400 mt-0.5">Cross-project testing metrics, coverage, and execution health</p>
            </div>
            <Link href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              View all projects
            </Link>
          </div>
          
          {/* ── Stat cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total Test Cases */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Test Cases</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{metrics.totalCases}</div>
              <div className="text-xs text-white/60 mt-1">{metrics.totalProjects} projects</div>
            </div>

            {/* Global Automation */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", boxShadow: "0 4px 20px rgba(5,150,105,0.35)" }}>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Automation</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldCheck size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{automatedPercent.toFixed(1)}%</div>
              <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white/80 rounded-full" style={{ width: `${automatedPercent}%` }} />
              </div>
            </div>

            {/* Total Test Runs */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Test Runs</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <PlayCircle size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{metrics.totalRuns}</div>
              <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                <TrendingUp size={11} /> Execution volume
              </div>
            </div>

            {/* Global Pass Rate */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)", boxShadow: "0 4px 20px rgba(219,39,119,0.35)" }}>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pass Rate</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={15} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{metrics.passRate.toFixed(1)}%</div>
              <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white/80 rounded-full" style={{ width: `${metrics.passRate}%` }} />
              </div>
            </div>

          </div>

          {/* ── Trend + Donut ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" strokeWidth={2.5} />
                    Execution Trends
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Test results over the last 14 days</p>
                </div>
              </div>
              <div className="flex-1 p-5 min-h-[280px]">
                <ExecutionTrendChart data={trendData} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" strokeWidth={2.5} />
                  Automation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Coverage across all projects</p>
              </div>
              <div className="flex-1 p-5 flex flex-col items-center justify-center">
                <div className="relative w-full h-[200px]">
                  <AutomationDonutChart data={automation} />
                </div>
                <div className="w-full mt-4 space-y-1.5">
                  {[
                    { label: "Automated",       value: automation.automated,      color: "#10b981" },
                    { label: "To Be Automated",  value: automation.toBeAutomated,  color: "#f59e0b" },
                    { label: "Manual",           value: automation.manual,         color: "#cbd5e1" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs font-semibold text-slate-600">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
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
