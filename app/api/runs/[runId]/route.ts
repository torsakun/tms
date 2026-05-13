// Fetch a specific test run and all its results/cases for execution UI
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        results: {
          include: {
            testCase: {
              include: { steps: true }
            }
          }
        }
      }
    });

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    return NextResponse.json(run);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  try {
    // Delete the test run. Cascading delete should handle related results if set in schema.
    await prisma.testRun.delete({
      where: { id: runId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
