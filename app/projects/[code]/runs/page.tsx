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
  let totalFailed = 0;

  runs.forEach(run => {
    totalTests += run.results.length;
    totalCompleted += run.results.filter((r: any) => r.status !== "IN_PROGRESS").length;
    totalFailed += run.results.filter((r: any) => r.status === "FAILED").length;
  });

  const completionRate = totalTests > 0 ? ((totalCompleted / totalTests) * 100).toFixed(1) : "0.0";

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-5 flex items-center space-x-4 transition-colors">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <PlayCircle size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Runs</div>
                <div className="text-2xl font-bold text-text-main">{totalRuns}</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-5 flex items-center space-x-4 transition-colors">
              <div className="w-10 h-10 bg-[#6554c0]/10 text-[#6554c0] rounded-xl flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Active Runs</div>
                <div className="text-2xl font-bold text-text-main">{activeRuns}</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-5 flex items-center space-x-4 transition-colors">
              <div className="w-10 h-10 bg-[#00875a]/10 text-[#00875a] rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Global Completion</div>
                <div className="text-2xl font-bold text-text-main">{completionRate}%</div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none p-5 flex items-center space-x-4 transition-colors">
              <div className="w-10 h-10 bg-[#de350b]/10 text-[#de350b] rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Failed</div>
                <div className="text-2xl font-bold text-text-main">{totalFailed}</div>
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
