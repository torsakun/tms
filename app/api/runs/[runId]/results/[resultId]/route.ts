import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ runId: string; resultId: string }> },
) {
  const { runId, resultId } = await params;
  try {
    const body = await req.json();
    const { status, timeSpent, errorMessage, comment, stepResults } = body;
    let { assigneeId } = body;

    // Auto-assign to the current user when they change the status and no explicit assignee is set
    if (status && !assigneeId) {
      const actor = await getSessionUser();
      if (actor) {
        // Only auto-assign if the result has no assignee yet
        const existing = await prisma.testRunResult.findUnique({
          where: { id: resultId },
          select: { assigneeId: true },
        });
        if (!existing?.assigneeId) {
          assigneeId = actor.id;
        }
      }
    }

    const result = await prisma.testRunResult.update({
      where: {
        id: resultId,
        runId: runId, // ensure it belongs to this run
      },
      data: {
        status,
        timeSpent,
        errorMessage,
        comment,
        stepResults,
        assigneeId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update run result" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ runId: string; resultId: string }> },
) {
  const { runId, resultId } = await params;
  try {
    await prisma.testRunResult.delete({
      where: {
        id: resultId,
        runId: runId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete run result" },
      { status: 500 },
    );
  }
}
