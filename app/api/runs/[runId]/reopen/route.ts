import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit-logger";

// Reopen a completed/aborted run back to ACTIVE so execution can continue.
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
      userId: (session.user as any).id,
      action: "UPDATED",
      entity: "TEST_RUN",
      entityId: run.id,
      details: `Reopened Test Run: ${run.title}`,
    });

    return NextResponse.json({ success: true, run: updated });
  } catch (error: any) {
    console.error("Reopen Run Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
