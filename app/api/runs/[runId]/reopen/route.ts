import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit-logger";
import { requireRunAccess } from "@/lib/project-route-auth";

// Reopen a completed/aborted run back to ACTIVE so execution can continue.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const access = await requireRunAccess(runId);
    if (access instanceof NextResponse) return access;

    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      select: { id: true, title: true, status: true, projectId: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Run is already active" },
        { status: 400 },
      );
    }

    const updated = await prisma.testRun.update({
      where: { id: runId },
      data: { status: "ACTIVE" },
    });

    await logAudit({
      projectId: run.projectId,
      userId: access.userId,
      action: "UPDATED",
      entity: "TEST_RUN",
      entityId: run.id,
      details: `Reopened Test Run: ${run.title}`,
    });

    return NextResponse.json({ success: true, run: updated });
  } catch (error: unknown) {
    console.error("Reopen Run Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reopen run" },
      { status: 500 },
    );
  }
}
