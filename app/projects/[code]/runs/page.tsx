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
    <div className="flex flex-col flex-1 bg-bg transition-colors min-h-0 overflow-hidden">
      <TestRunsList initialRuns={serializedRuns} code={code} />
    </div>
  );
}
