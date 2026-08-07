import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string; resultId: string }> },
) {
  const { runId, resultId } = await params;
  try {
    const result = await prisma.testRunResult.findUnique({
      where: {
        id: resultId,
        runId: runId,
      },
      include: {
        testCase: {
          include: { steps: true },
        },
        assignee: { select: { id: true, name: true, email: true } },
        linkedIssues: { orderBy: { createdAt: "desc" } },
        attachments: true,
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch run result" },
      { status: 500 },
    );
  }
}

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

    // Get current assignee to check if it changed
    const currentResult = await prisma.testRunResult.findUnique({
      where: { id: resultId },
      select: { assigneeId: true, testCase: { select: { title: true } } },
    });

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

    const actor = await getSessionUser();
    // Trigger notification if assignee changed and it's not the actor themselves
    if (
      assigneeId &&
      currentResult &&
      currentResult.assigneeId !== assigneeId &&
      actor &&
      assigneeId !== actor.id
    ) {
      await prisma.notification.create({
        data: {
          recipientId: assigneeId,
          actorId: actor.id,
          type: "ASSIGNMENT",
          entityId: resultId,
          title: "Assigned Test Run",
          message: `You have been assigned to execute test case: ${currentResult.testCase?.title || "Unknown"}`,
        },
      });
    }

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
