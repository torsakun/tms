export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { TestRunsList } from "./TestRunsList";
import { Activity, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";

export default async function RunsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let runs: any[] = [];
  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        testRuns: {
          orderBy: { createdAt: "desc" },
          include: {
            results: true,
            author: { select: { name: true, email: true } },
            environment: { select: { title: true } },
          },
        },
      },
    });
    runs = project?.testRuns || [];
  } catch (error) {
    console.warn("Database connection failed. Falling back to empty state.");
  }

  const totalRuns = runs.length;
  const activeRuns = runs.filter((r) => r.status === "ACTIVE").length;

  let totalTests = 0;
  let totalCompleted = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  runs.forEach((run) => {
    totalTests += run.results.length;
    totalCompleted += run.results.filter(
      (r: any) => r.status !== "UNTESTED" && r.status !== "IN_PROGRESS",
    ).length;
    totalPassed += run.results.filter((r: any) => r.status === "PASSED").length;
    totalFailed += run.results.filter((r: any) => r.status === "FAILED").length;
  });

  const completionRate =
    totalTests > 0 ? ((totalCompleted / totalTests) * 100).toFixed(1) : "0.0";
  const passRate =
    totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";
  const failRate =
    totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : "0.0";

  const serializedRuns = runs.map((run) => ({
    ...run,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 bg-background transition-colors min-h-0 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-main tracking-tight">
              Test Runs
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
              {totalRuns}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform shadow-premium"
            style={{
              background: "var(--primary)",
            }}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Total Runs
              </span>
              <div className="w-8 h-8 rounded-xl bg-surface/20 flex items-center justify-center shadow-inner">
                <PlayCircle size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {totalRuns}
            </div>
          </div>

          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform shadow-premium"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            }}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Active Runs
              </span>
              <div className="w-8 h-8 rounded-xl bg-surface/20 flex items-center justify-center shadow-inner">
                <Activity size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {activeRuns}
            </div>
          </div>

          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform shadow-premium"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            }}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Pass Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-surface/20 flex items-center justify-center shadow-inner">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {passRate}%
            </div>
            <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-surface/80 rounded-full"
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform shadow-premium"
            style={{
              background: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)",
            }}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface/10" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Fail Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-surface/20 flex items-center justify-center shadow-inner">
                <AlertCircle size={15} />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {failRate}%
            </div>
            <div className="w-full h-1 bg-black/20 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-surface/80 rounded-full"
                style={{ width: `${failRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Runs table */}
        <TestRunsList initialRuns={serializedRuns} code={code} />
      </div>
    </div>
  );
}
