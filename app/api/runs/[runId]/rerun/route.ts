import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit-logger";
import { requireRunAccess } from "@/lib/project-route-auth";

// Create a NEW run containing only the cases that failed/blocked in a source run.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const access = await requireRunAccess(runId);
    if (access instanceof NextResponse) return access;

    const source = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        project: { select: { id: true, code: true } },
        results: { select: { caseId: true, status: true } },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Optional body { statuses: [...] } — default to the unsuccessful ones.
    let statuses = ["FAILED", "BLOCKED"];
    try {
      const body = await req.json();
      if (Array.isArray(body?.statuses) && body.statuses.length > 0) {
        statuses = body.statuses;
      }
    } catch {
      // no body — keep default
    }

    const caseIds = Array.from(
      new Set(
        source.results
          .filter((r) => statuses.includes(r.status) && r.caseId)
          .map((r) => r.caseId as string),
      ),
    );

    if (caseIds.length === 0) {
      return NextResponse.json(
        { error: "No matching cases to re-run in this run" },
        { status: 400 },
      );
    }

    const run = await prisma.testRun.create({
      data: {
        title: `Re-run: ${source.title}`,
        description: `Re-run of failed/blocked cases from "${source.title}"`,
        projectId: source.project.id,
        authorId: access.userId,
        planId: source.planId || undefined,
        environmentId: source.environmentId || undefined,
        milestoneId: source.milestoneId || undefined,
        results: {
          create: caseIds.map((caseId) => ({
            caseId,
            status: "IN_PROGRESS" as const,
          })),
        },
      },
    });

    await logAudit({
      projectId: source.project.id,
      userId: access.userId,
      action: "CREATED",
      entity: "TEST_RUN",
      entityId: run.id,
      details: `Re-ran ${caseIds.length} case(s) from: ${source.title}`,
    });

    return NextResponse.json(
      { success: true, run, projectCode: source.project.code },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Re-run Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create re-run" },
      { status: 500 },
    );
  }
}
