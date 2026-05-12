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

export const dynamic = "force-dynamic";

export default async function GlobalDashboardPage() {
  let dashboardData = {
    metrics: { totalProjects: 0, totalCases: 0, totalRuns: 0, passRate: 0 },
    automation: { automated: 0, manual: 0, toBeAutomated: 0 },
    projects: [] as any[],
    recentRuns: [] as any[],
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
      take: 10
    });

    // Recent Runs Table Data
    const recentRuns = await prisma.testRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { 
        results: { select: { status: true } },
        project: { select: { name: true, code: true } }
      }
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
      trendData: Array.from(trendMap.values())
    };
    
    dashboardData.metrics.passRate = totalExecuted > 0 ? (totalPassed / totalExecuted) * 100 : 0;
    
  } catch (err) {
    console.error("Failed to fetch QA dashboard data:", err);
  }

  const { metrics, automation, projects, recentRuns, trendData } = dashboardData;
  const totalAutomationCases = automation.automated + automation.manual + automation.toBeAutomated;
  const automatedPercent = totalAutomationCases > 0 ? (automation.automated / totalAutomationCases) * 100 : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* Clean SaaS Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <BarChart2 className="mr-3 text-blue-600" size={26} />
            Quality Assurance Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cross-project testing metrics, coverage, and execution health.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/projects" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-semibold transition-all shadow-sm">
            View All Projects
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* Key QA Metrics (Top Row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Test Cases</div>
                <div className="w-10 h-10 bg-blue-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                  <FileText size={20} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{metrics.totalCases}</div>
                <div className="text-sm font-medium text-slate-500 mt-1">Across {metrics.totalProjects} active projects</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Automation</div>
                <div className="w-10 h-10 bg-emerald-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{automatedPercent.toFixed(1)}%</div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${automatedPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Test Runs</div>
                <div className="w-10 h-10 bg-indigo-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                  <PlayCircle size={20} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{metrics.totalRuns}</div>
                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center">
                  <TrendingUp size={14} className="text-emerald-500 mr-1" />
                  Execution volume
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Pass Rate</div>
                <div className="w-10 h-10 bg-green-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100/50">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{metrics.passRate.toFixed(1)}%</div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${metrics.passRate}%` }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* New Section: Trend Chart & Automation Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 flex items-center">
                    <Activity className="mr-2 text-indigo-500" size={18} strokeWidth={2.5} />
                    Execution Trends
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">Test results over the last 14 days</p>
                </div>
              </div>
              <div className="flex-1 p-6 min-h-[300px]">
                <ExecutionTrendChart data={trendData} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm col-span-1 flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 bg-white">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center">
                  <ShieldCheck className="mr-2 text-emerald-500" size={18} strokeWidth={2.5} />
                  Automation Distribution
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Coverage status across all projects</p>
              </div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div className="relative w-full h-[220px]">
                  <AutomationDonutChart data={automation} />
                </div>
                
                {/* Custom Legend */}
                <div className="w-full mt-4 space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3 shadow-sm"></div>
                      <span className="text-sm text-slate-700 font-bold">Automated</span>
                    </div>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md text-sm">{automation.automated}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-3 shadow-sm"></div>
                      <span className="text-sm text-slate-700 font-bold">To Be Automated</span>
                    </div>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md text-sm">{automation.toBeAutomated}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-slate-400 mr-3 shadow-sm"></div>
                      <span className="text-sm text-slate-700 font-bold">Manual</span>
                    </div>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md text-sm">{automation.manual}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row - Project Matrix & Execution Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Project Quality Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center">
                  <Folder className="mr-2 text-blue-500" size={18} strokeWidth={2.5} />
                  Project Quality Matrix
                </h2>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-6 py-3.5">Project</th>
                      <th className="px-6 py-3.5 text-right">Cases</th>
                      <th className="px-6 py-3.5">Automation</th>
                      <th className="px-6 py-3.5">Health</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {projects.map((p) => (
                      <tr key={p.code} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/projects/${p.code}/repository`} className="flex flex-col">
                            <span className="font-bold text-slate-800 hover:text-blue-600 transition-colors">{p.name}</span>
                            <span className="text-[11px] font-bold text-slate-400 mt-0.5">{p.code}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-600">{p.cases}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3 max-w-[80px]">
                              <div className="h-full bg-emerald-500" style={{width: `${p.automated}%`}}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600">{p.automated.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.lastRunHealth !== null ? (
                            <div className="flex items-center">
                              {p.lastRunHealth >= 90 ? <CheckCircle2 size={16} className="text-emerald-500 mr-1.5" /> : 
                               p.lastRunHealth >= 70 ? <AlertCircle size={16} className="text-amber-500 mr-1.5" /> : 
                               <XCircle size={16} className="text-red-500 mr-1.5" />}
                              <span className="font-bold text-slate-700">{p.lastRunHealth.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">No runs</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">No projects found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent Executions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center">
                  <PlayCircle className="mr-2 text-indigo-500" size={18} strokeWidth={2.5} />
                  Recent Executions
                </h2>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-6 py-3.5">Run</th>
                      <th className="px-6 py-3.5 w-24">Status</th>
                      <th className="px-6 py-3.5">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentRuns.map((run) => {
                      const passPercent = run.metrics.total > 0 ? (run.metrics.passed / run.metrics.total) * 100 : 0;
                      const failPercent = run.metrics.total > 0 ? (run.metrics.failed / run.metrics.total) * 100 : 0;
                      const blockPercent = run.metrics.total > 0 ? (run.metrics.blocked / run.metrics.total) * 100 : 0;
                      const skipPercent = run.metrics.total > 0 ? (run.metrics.skipped / run.metrics.total) * 100 : 0;
                      const untestedPercent = run.metrics.total > 0 ? (run.metrics.untested / run.metrics.total) * 100 : 0;
                      
                      const isCompleted = run.metrics.untested === 0 && run.metrics.total > 0;

                      return (
                        <tr key={run.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link href={`/projects/${run.project.code}/runs/${run.id}`} className="flex flex-col">
                              <span className="font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center">
                                {run.title}
                                <ChevronRight size={14} className="ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <div className="flex items-center mt-1">
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{run.project.code}-{run.id.split('-')[0]}</span>
                                <span className="mx-2 text-slate-300">•</span>
                                <span className="text-[11px] font-medium text-slate-400 flex items-center">
                                  <Clock size={10} className="mr-1 opacity-70" />
                                  {new Date(run.createdAt).toLocaleString('en-GB', { 
                                    day: 'numeric', month: 'short', year: 'numeric', 
                                    hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                             {isCompleted ? (
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                 Completed
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                                 Active
                               </span>
                             )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden mb-1.5">
                              <div style={{ width: `${passPercent}%` }} className="bg-emerald-500" title={`Passed: ${run.metrics.passed}`} />
                              <div style={{ width: `${failPercent}%` }} className="bg-red-500" title={`Failed: ${run.metrics.failed}`} />
                              <div style={{ width: `${blockPercent}%` }} className="bg-amber-500" title={`Blocked: ${run.metrics.blocked}`} />
                              <div style={{ width: `${skipPercent}%` }} className="bg-slate-400" title={`Skipped: ${run.metrics.skipped}`} />
                              <div style={{ width: `${untestedPercent}%` }} className="bg-slate-200" title={`Untested: ${run.metrics.untested}`} />
                            </div>
                            <div className="flex space-x-2 text-[11px] font-bold">
                              {run.metrics.passed > 0 && <span className="text-emerald-600">{run.metrics.passed}P</span>}
                              {run.metrics.failed > 0 && <span className="text-red-600">{run.metrics.failed}F</span>}
                              {run.metrics.untested > 0 && <span className="text-slate-400">{run.metrics.untested}U</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {recentRuns.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium">No recent test runs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
