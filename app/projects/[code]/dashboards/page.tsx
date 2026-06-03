import React from "react";
import Link from "next/link";
import { 
  Folder, 
  FileText, 
  PlayCircle, 
  Activity, 
  Settings, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({ 
  params 
}: { 
  params: Promise<{ code: string }> 
}) {
  const { code } = await params;
  
  let projectData = null;
  let dashboardData = {
    metrics: { totalSuites: 0, totalCases: 0, totalRuns: 0, activeRuns: 0 },
    severityCounts: [] as { severity: string; count: number }[],
    recentRuns: [] as any[],
    outdatedCases: [] as any[]
  };

  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        _count: { select: { suites: true, testCases: true, testRuns: true } },
        members: true
      }
    });

    if (project) {
      projectData = project;
      
      const activeRunsCount = await prisma.testRun.count({ where: { projectId: project.id, status: "ACTIVE" } });

      // Group cases by severity
      const severityGroups = await prisma.testCase.groupBy({
        by: ['severity'],
        where: { projectId: project.id },
        _count: { id: true }
      });
      
      const severityCounts = severityGroups.map(g => ({
        severity: g.severity,
        count: g._count.id
      }));

      const recentRuns = await prisma.testRun.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { results: { select: { status: true } } }
      });

      const outdatedCases = await prisma.testCase.findMany({
        where: { projectId: project.id, isOutdated: true },
        select: { id: true, title: true, jiraId: true },
        orderBy: { updatedAt: "desc" },
        take: 5
      });

      dashboardData = {
        metrics: {
          totalSuites: project._count.suites,
          totalCases: project._count.testCases,
          totalRuns: project._count.testRuns,
          activeRuns: activeRunsCount
        },
        severityCounts,
        recentRuns: recentRuns.map(run => {
          const total = run.results.length;
          const passed = run.results.filter(r => r.status === "PASSED").length;
          const failed = run.results.filter(r => r.status === "FAILED").length;
          const blocked = run.results.filter(r => r.status === "BLOCKED").length;
          const skipped = run.results.filter(r => r.status === "SKIPPED").length;
          const untested = total - passed - failed - blocked - skipped;
          return { id: run.id, title: run.title, status: run.status, createdAt: run.createdAt, metrics: { total, passed, failed, blocked, skipped, untested } };
        }),
        outdatedCases
      };
    }
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
  }

  if (!projectData) {
    return <div className="p-8">Project not found</div>;
  }

  const { metrics, severityCounts, recentRuns, outdatedCases } = dashboardData;
  
  // Severity order mapping
  const severityOrder = ["BLOCKER", "CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL", "NOT_SET"];
  const severityColors: Record<string, string> = {
    BLOCKER: "bg-red-600",
    CRITICAL: "bg-red-500",
    MAJOR: "bg-orange-500",
    NORMAL: "bg-blue-500",
    MINOR: "bg-emerald-500",
    TRIVIAL: "bg-slate-400",
    NOT_SET: "bg-slate-300"
  };

  const getSeverityCount = (sev: string) => severityCounts.find(s => s.severity === sev)?.count || 0;

  return (
    <div className="flex flex-col flex-1 bg-surface-hover min-h-0">
      <header className="bg-surface border-b border-border px-8 py-6 shrink-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight flex items-center">
            {projectData.name} Overview
          </h1>
          <p className="text-sm text-text-muted mt-1 flex items-center">
            <span className="font-mono text-xs bg-surface-hover text-text-muted px-1.5 py-0.5 rounded border border-border mr-2">{projectData.code}</span>
            {metrics.totalCases} Test Cases • {metrics.totalSuites} Suites • {projectData.members.length} Members
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/projects/${code}/settings`} className="px-4 py-2 bg-surface border border-border text-text-main hover:bg-surface-hover hover:text-text-main rounded-md text-sm font-medium transition-colors shadow-sm flex items-center">
            <Settings size={16} className="mr-2" /> Settings
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Operational Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-semibold text-text-muted uppercase tracking-wider">Total Test Cases</div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main">{metrics.totalCases}</div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-semibold text-text-muted uppercase tracking-wider">Test Suites</div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <Folder size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main">{metrics.totalSuites}</div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-semibold text-text-muted uppercase tracking-wider">Total Runs</div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <PlayCircle size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main">{metrics.totalRuns}</div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-semibold text-text-muted uppercase tracking-wider">Active Runs</div>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <Activity size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main">{metrics.activeRuns}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Test Case Severity Breakdown (Operational focus) */}
            <div className="bg-surface rounded-xl border border-border shadow-sm col-span-1 flex flex-col">
              <div className="px-6 py-4 border-b border-border bg-surface-hover/50">
                <h2 className="text-base font-bold text-text-main flex items-center">
                  <AlertTriangle className="mr-2 text-text-muted" size={18} />
                  Test Case Severity
                </h2>
              </div>
              
              <div className="flex-1 p-6">
                {metrics.totalCases > 0 ? (
                  <div className="space-y-4">
                    {severityOrder.map(sev => {
                      const count = getSeverityCount(sev);
                      if (count === 0 && sev === "NOT_SET") return null; // hide NOT_SET if empty
                      
                      const percent = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                      const color = severityColors[sev];
                      
                      return (
                        <div key={sev} className="w-full">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-text-main capitalize">{sev.toLowerCase().replace('_', ' ')}</span>
                            <span className="font-bold text-text-main">{count} <span className="text-text-muted text-xs font-normal ml-1">({percent.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted">
                    <FileText size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No test cases in project</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Test Runs (2/3 width) */}
            <div className="bg-surface rounded-xl border border-border shadow-sm col-span-1 lg:col-span-2 flex flex-col">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-hover/50">
                <h2 className="text-base font-bold text-text-main flex items-center">
                  <PlayCircle className="mr-2 text-text-muted" size={18} />
                  Recent Execution Activity
                </h2>
                <Link href={`/projects/${code}/runs`} className="text-sm font-medium text-primary hover:underline">
                  View all runs
                </Link>
              </div>

              <div className="p-6">
                {recentRuns.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-surface-hover text-text-muted rounded-full flex items-center justify-center mb-3">
                      <PlayCircle size={24} />
                    </div>
                    <p className="text-text-muted text-sm">No test runs executed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRuns.map((run) => {
                      const passPercent = run.metrics.total > 0 ? (run.metrics.passed / run.metrics.total) * 100 : 0;
                      const failPercent = run.metrics.total > 0 ? (run.metrics.failed / run.metrics.total) * 100 : 0;
                      const blockPercent = run.metrics.total > 0 ? (run.metrics.blocked / run.metrics.total) * 100 : 0;
                      const skipPercent = run.metrics.total > 0 ? (run.metrics.skipped / run.metrics.total) * 100 : 0;
                      const untestedPercent = run.metrics.total > 0 ? (run.metrics.untested / run.metrics.total) * 100 : 0;

                      return (
                        <Link key={run.id} href={`/projects/${code}/runs/${run.id}`} className="block border border-border rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group bg-surface-hover hover:bg-surface">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-text-main group-hover:text-primary transition-colors flex items-center">
                              {run.title}
                              <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs font-medium text-text-muted">
                              {new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <div className="w-full h-2 bg-slate-200 rounded-full flex overflow-hidden mb-3">
                            <div style={{ width: `${passPercent}%` }} className="bg-emerald-500" title={`Passed: ${run.metrics.passed}`} />
                            <div style={{ width: `${failPercent}%` }} className="bg-red-500" title={`Failed: ${run.metrics.failed}`} />
                            <div style={{ width: `${blockPercent}%` }} className="bg-amber-500" title={`Blocked: ${run.metrics.blocked}`} />
                            <div style={{ width: `${skipPercent}%` }} className="bg-slate-400" title={`Skipped: ${run.metrics.skipped}`} />
                            <div style={{ width: `${untestedPercent}%` }} className="bg-slate-200" title={`Untested: ${run.metrics.untested}`} />
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs font-medium">
                            {run.metrics.passed > 0 && <div className="text-emerald-600">{run.metrics.passed} passed</div>}
                            {run.metrics.failed > 0 && <div className="text-red-600">{run.metrics.failed} failed</div>}
                            {run.metrics.blocked > 0 && <div className="text-amber-600">{run.metrics.blocked} blocked</div>}
                            {run.metrics.untested > 0 && <div className="text-text-muted">{run.metrics.untested} untested</div>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Impacted Test Cases */}
            {outdatedCases.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm col-span-1 lg:col-span-3 flex flex-col">
                <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between">
                  <h2 className="text-base font-bold text-amber-900 flex items-center">
                    <AlertTriangle className="mr-2 text-amber-600" size={18} />
                    Impacted Test Cases (Jira Requirement Changed)
                  </h2>
                  <Link href={`/projects/${code}/repository`} className="text-sm font-medium text-amber-700 hover:underline">
                    Go to Repository
                  </Link>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outdatedCases.map(tc => (
                      <div key={tc.id} className="bg-surface border border-amber-200 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">Outdated</span>
                          {tc.jiraId && <span className="text-xs text-text-muted font-mono">{tc.jiraId}</span>}
                        </div>
                        <h3 className="text-sm font-bold text-text-main truncate">{tc.title}</h3>
                        <p className="text-xs text-text-muted mt-2">Requirement changed in Jira. Needs AI Impact Analysis.</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
