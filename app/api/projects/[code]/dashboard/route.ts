import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;

    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        _count: {
          select: { suites: true, testCases: true, testRuns: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Automation Coverage
    const automatedCasesCount = await prisma.testCase.count({
      where: { projectId: project.id, automationStatus: "AUTOMATED" },
    });

    const manualCasesCount = await prisma.testCase.count({
      where: { projectId: project.id, automationStatus: "MANUAL" },
    });

    const toBeAutomatedCount = await prisma.testCase.count({
      where: { projectId: project.id, automationStatus: "TO_BE_AUTOMATED" },
    });

    // Active Runs
    const activeRunsCount = await prisma.testRun.count({
      where: { projectId: project.id, status: "ACTIVE" },
    });

    // Recent Runs with results
    const recentRuns = await prisma.testRun.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        results: {
          select: { status: true },
        },
      },
    });

    const formattedRecentRuns = recentRuns.map((run) => {
      const total = run.results.length;
      const passed = run.results.filter((r) => r.status === "PASSED").length;
      const failed = run.results.filter((r) => r.status === "FAILED").length;
      const blocked = run.results.filter((r) => r.status === "BLOCKED").length;
      const skipped = run.results.filter((r) => r.status === "SKIPPED").length;
      const untested = run.results.filter(
        (r) => r.status === "IN_PROGRESS" || r.status === ("UNTESTED" as any),
      ).length;

      return {
        id: run.id,
        title: run.title,
        status: run.status,
        createdAt: run.createdAt,
        metrics: {
          total,
          passed,
          failed,
          blocked,
          skipped,
          untested,
        },
      };
    });

    return NextResponse.json({
      metrics: {
        totalSuites: project._count.suites,
        totalCases: project._count.testCases,
        totalRuns: project._count.testRuns,
        activeRuns: activeRunsCount,
      },
      automation: {
        automated: automatedCasesCount,
        manual: manualCasesCount,
        toBeAutomated: toBeAutomatedCount,
      },
      recentRuns: formattedRecentRuns,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 },
    );
  }
}
