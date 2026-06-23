import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Execution history for a single test case across every run it appeared in.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { caseId } = await params;
  try {
    const results = await prisma.testRunResult.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        timeSpent: true,
        createdAt: true,
        testRun: {
          select: { id: true, title: true, status: true },
        },
        assignee: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch case history" },
      { status: 500 },
    );
  }
}
