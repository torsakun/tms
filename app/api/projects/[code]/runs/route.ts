import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import { logAudit } from "@/lib/audit-logger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: projectIdOrCode } = await params;
  try {
    let project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectIdOrCode }, { code: projectIdOrCode }],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(
      project.code,
      (session.user as any).id,
      ["EDITOR", "ADMIN"],
    );
    if (!hasAccess && (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to create test runs in this project",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { title, description, caseIds, planId, environmentId, milestoneId } =
      body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json(
        { error: "No test cases selected" },
        { status: 400 },
      );
    }

    const run = await prisma.testRun.create({
      data: {
        title,
        description,
        projectId: project.id,
        authorId: (session.user as any).id,
        planId: planId || undefined,
        environmentId: environmentId || undefined,
        milestoneId: milestoneId || undefined,
        results: {
          create: caseIds.map((caseId: string) => ({
            caseId,
            status: "IN_PROGRESS",
          })),
        },
      },
      include: {
        results: true,
      },
    });

    await logAudit({
      projectId: project.id,
      userId: (session.user as any).id,
      action: "CREATED",
      entity: "TEST_RUN",
      entityId: run.id,
      details: `Created Test Run: ${run.title}`,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("Failed to create run", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 },
    );
  }
}
