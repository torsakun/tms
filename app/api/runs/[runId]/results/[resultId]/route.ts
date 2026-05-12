import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ runId: string, resultId: string }> }) {
  const { runId, resultId } = await params;
  try {
    const body = await req.json();
    const { status, timeSpent, errorMessage, comment, stepResults, assigneeId } = body;

    const result = await prisma.testRunResult.update({
      where: {
        id: resultId,
        runId: runId // ensure it belongs to this run
      },
      data: {
        status,
        timeSpent,
        errorMessage,
        comment,
        stepResults,
        assigneeId
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update run result" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ runId: string, resultId: string }> }) {
  const { runId, resultId } = await params;
  try {
    await prisma.testRunResult.delete({
      where: {
        id: resultId,
        runId: runId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete run result" }, { status: 500 });
  }
}
