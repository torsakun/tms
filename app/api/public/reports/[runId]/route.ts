import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        project: { select: { code: true, name: true } },
        author: { select: { name: true, email: true } },
        environment: { select: { title: true } },
        milestone: { select: { title: true } },
        results: {
          include: {
            assignee: { select: { name: true, email: true } },
            linkedIssues: {
              select: { id: true, key: true, url: true, summary: true, severity: true },
            },
            testCase: {
              include: {
                steps: true,
                suite: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!run.isPublic) {
      return NextResponse.json(
        { error: "This report is not public" },
        { status: 403 },
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to fetch public run:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}
