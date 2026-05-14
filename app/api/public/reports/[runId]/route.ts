import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        project: { select: { code: true } },
        results: {
          include: {
            testCase: {
              include: { steps: true }
            }
          }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!run.isPublic) {
      return NextResponse.json({ error: "This report is not public" }, { status: 403 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to fetch public run:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
