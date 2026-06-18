// (Phase 2) Backend API Routes
// # Webhook สำหรับรับผลจาก Automation (Playwright/Cypress)
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const bulkResultSchema = z.object({
  results: z.array(
    z.object({
      caseId: z.string(),
      status: z.enum(["PASSED", "FAILED", "BLOCKED", "SKIPPED", "IN_PROGRESS"]),
      timeSpent: z.number().optional().nullable(),
      errorMessage: z.string().optional().nullable(),
      comment: z.string().optional().nullable(),
    }),
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const body = await req.json();
    const { results } = bulkResultSchema.parse(body);

    const run = await prisma.testRun.findUnique({ where: { id: runId } });
    if (!run)
      return NextResponse.json(
        { error: "Test Run not found" },
        { status: 404 },
      );

    const processedResults = await prisma.$transaction(
      results.map((res) =>
        prisma.testRunResult.upsert({
          where: {
            runId_caseId: { runId: runId, caseId: res.caseId },
          },
          update: {
            status: res.status,
            timeSpent: res.timeSpent ?? undefined,
            errorMessage: res.errorMessage ?? undefined,
            comment: res.comment ?? undefined,
          },
          create: {
            runId: runId,
            caseId: res.caseId,
            status: res.status,
            timeSpent: res.timeSpent ?? undefined,
            errorMessage: res.errorMessage ?? undefined,
            comment: res.comment ?? undefined,
          },
        }),
      ),
    );

    return NextResponse.json({
      message: `Successfully processed ${processedResults.length} results`,
      count: processedResults.length,
    });
  } catch (error) {
    console.error("Bulk Update Error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk results" },
      { status: 500 },
    );
  }
}
