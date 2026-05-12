import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ code: string; runId: string }> }) {
  const { code, runId } = await params;
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        results: {
          select: { caseId: true }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to fetch run:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ code: string; runId: string }> }) {
  const { code, runId } = await params;
  try {
    const body = await req.json();
    const { title, description, caseIds, environmentId, milestoneId } = body;

    if (!title || !caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: "Title and at least one test case are required" }, { status: 400 });
    }

    // Update run details
    const run = await prisma.testRun.update({
      where: { id: runId },
      data: {
        title,
        description,
        environmentId: environmentId || null,
        milestoneId: milestoneId || null,
      },
    });

    // Fetch existing results to diff
    const existingResults = await prisma.testRunResult.findMany({
      where: { runId: runId },
      select: { id: true, caseId: true }
    });

    const existingCaseIds = new Set(existingResults.map(r => r.caseId));
    const newCaseIds = new Set(caseIds);

    const casesToAdd = caseIds.filter((id: string) => !existingCaseIds.has(id));
    const casesToRemove = existingResults.filter(r => !newCaseIds.has(r.caseId)).map(r => r.id);

    // Delete removed cases
    if (casesToRemove.length > 0) {
      await prisma.testRunResult.deleteMany({
        where: {
          id: { in: casesToRemove }
        }
      });
    }

    // Add new cases
    if (casesToAdd.length > 0) {
      await prisma.testRunResult.createMany({
        data: casesToAdd.map((id: string) => ({
          runId: runId,
          caseId: id,
          status: "IN_PROGRESS",
        }))
      });
    }

    return NextResponse.json({ success: true, run });
  } catch (error) {
    console.error("Failed to update run:", error);
    return NextResponse.json({ error: "Failed to update run" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string; runId: string }> }) {
  const { code, runId } = await params;
  try {
    await prisma.testRun.delete({
      where: { id: runId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete run:", error);
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
