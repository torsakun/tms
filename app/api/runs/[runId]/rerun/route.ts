import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit-logger";

// Create a NEW run containing only the cases that failed/blocked in a source run.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        authorId: (session.user as any).id,
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
      userId: (session.user as any).id,
      action: "CREATED",
      entity: "TEST_RUN",
      entityId: run.id,
      details: `Re-ran ${caseIds.length} case(s) from: ${source.title}`,
    });

    return NextResponse.json(
      { success: true, run, projectCode: source.project.code },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Re-run Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
