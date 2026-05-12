import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: projectIdOrCode } = await params;
  try {
    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectIdOrCode },
          { code: projectIdOrCode }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, caseIds, planId, environmentId, milestoneId } = body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: "No test cases selected" }, { status: 400 });
    }

    const run = await prisma.testRun.create({
      data: {
        title,
        description,
        projectId: project.id,
        planId: planId || undefined,
        environmentId: environmentId || undefined,
        milestoneId: milestoneId || undefined,
        results: {
          create: caseIds.map((caseId: string) => ({
            caseId,
            status: "IN_PROGRESS"
          }))
        }
      },
      include: {
        results: true
      }
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("Failed to create run", error);
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }
}
