export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { TestRunsList } from "./TestRunsList";
import { Activity, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";

export default async function RunsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let runs: any[] = [];
  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        testRuns: {
          orderBy: { createdAt: 'desc' },
          include: { results: true }
        }
      }
    });
    runs = project?.testRuns || [];
  } catch (error) {
    console.warn("Database connection failed. Falling back to empty state.");
  }

  // Calculate insights
  const totalRuns = runs.length;
  const activeRuns = runs.filter(r => r.status === "ACTIVE").length;
  
  let totalTests = 0;
  let totalCompleted = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  runs.forEach(run => {
    totalTests += run.results.length;
    totalCompleted += run.results.filter((r: any) => r.status !== "UNTESTED" && r.status !== "IN_PROGRESS").length;
    totalPassed += run.results.filter((r: any) => r.status === "PASSED").length;
    totalFailed += run.results.filter((r: any) => r.status === "FAILED").length;
  });

  const completionRate = totalTests > 0 ? ((totalCompleted / totalTests) * 100).toFixed(1) : "0.0";
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";
  const failRate = totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : "0.0";

  // Serialize dates for client component
  const serializedRuns = runs.map(run => ({
    ...run,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 bg-background transition-colors min-h-0">
      <header className="h-16 bg-surface shadow-[0_1px_15px_rgba(0,0,0,0.04)] dark:shadow-none flex items-center justify-between px-8 shrink-0 z-10 relative transition-colors">
        <h1 className="text-xl font-bold text-text-main">Test Runs</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Top Insights Widget */}
        <div className="px-8 py-8 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center space-x-3 transition-colors">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <PlayCircle size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Total Runs</div>
                <div className="text-xl font-bold text-text-main">{totalRuns}</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center space-x-3 transition-colors">
              <div className="w-10 h-10 bg-[#6554c0]/10 text-[#6554c0] rounded-xl flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Active Runs</div>
                <div className="text-xl font-bold text-text-main">{activeRuns}</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center space-x-3 transition-colors">
              <div className="w-10 h-10 bg-blue-500/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Completion</div>
                <div className="text-xl font-bold text-text-main">{completionRate}%</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center space-x-3 transition-colors">
              <div className="w-10 h-10 bg-[#00875a]/10 text-[#00875a] rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Pass Rate</div>
                <div className="text-xl font-bold text-text-main">{passRate}%</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center space-x-3 transition-colors">
              <div className="w-10 h-10 bg-[#de350b]/10 text-[#de350b] rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Fail Rate</div>
                <div className="text-xl font-bold text-text-main">{failRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive List */}
        <TestRunsList initialRuns={serializedRuns} code={code} />
      </div>
    </div>
  );
}
