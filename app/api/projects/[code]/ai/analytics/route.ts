import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // ROI Calculation
    const automatedCasesCount = await prisma.testCase.count({
      where: { projectId: project.id, automationStatus: "AUTOMATED" },
    });

    const automatedResultsCount = await prisma.testRunResult.count({
      where: {
        testRun: { projectId: project.id },
        testCase: { automationStatus: "AUTOMATED" },
        status: { in: ["PASSED", "FAILED"] },
      },
    });

    // Assumptions
    const HOURS_PER_GENERATION = 45 / 60; // 45 mins
    const HOURS_PER_EXECUTION = 15 / 60; // 15 mins
    const HOURLY_RATE_USD = 35;
    const HOURLY_RATE_THB = 1200;

    const hoursSavedGeneration = automatedCasesCount * HOURS_PER_GENERATION;
    const hoursSavedExecution = automatedResultsCount * HOURS_PER_EXECUTION;
    const totalHoursSaved = hoursSavedGeneration + hoursSavedExecution;

    const roi = {
      scriptsGenerated: automatedCasesCount,
      hoursSavedGeneration: Math.round(hoursSavedGeneration * 10) / 10,
      totalAutomatedRuns: automatedResultsCount,
      hoursSavedExecution: Math.round(hoursSavedExecution * 10) / 10,
      totalHoursSaved: Math.round(totalHoursSaved * 10) / 10,
      estimatedValueUsd: Math.round(
        totalHoursSaved * HOURLY_RATE_USD,
      ).toLocaleString(),
      estimatedValueThb: Math.round(
        totalHoursSaved * HOURLY_RATE_THB,
      ).toLocaleString(),
    };

    // Flakiness Calculation
    const allAutomatedCases = await prisma.testCase.findMany({
      where: { projectId: project.id, automationStatus: "AUTOMATED" },
      select: { id: true, title: true },
    });

    const flakiness = [];

    for (const tc of allAutomatedCases) {
      // Get last 10 execution results
      const results = await prisma.testRunResult.findMany({
        where: { caseId: tc.id, status: { in: ["PASSED", "FAILED"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { status: true },
      });

      // Flakiness makes sense only if we have some history
      if (results.length >= 2) {
        let transitions = 0;

        // Reverse to chronological order for processing and display
        const history = results.reverse().map((r) => r.status);

        for (let i = 1; i < history.length; i++) {
          if (history[i] !== history[i - 1]) {
            transitions++;
          }
        }

        // Formula: transitions / (total_runs - 1) * 100
        const flakinessScore = Math.round(
          (transitions / (history.length - 1)) * 100,
        );

        flakiness.push({
          caseId: tc.id,
          title: tc.title,
          flakinessScore,
          recentStatuses: history,
        });
      }
    }

    // Sort by most flaky, descending
    flakiness.sort((a, b) => b.flakinessScore - a.flakinessScore);

    return NextResponse.json({ roi, flakiness: flakiness.slice(0, 5) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
