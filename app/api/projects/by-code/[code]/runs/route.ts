import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function resolveRunCaseIds({
  projectId,
  caseIds,
  planId,
}: {
  projectId: string;
  caseIds?: unknown;
  planId?: unknown;
}) {
  if (Array.isArray(caseIds) && caseIds.length > 0) {
    const uniqueCaseIds = Array.from(
      new Set(caseIds.filter((caseId): caseId is string => typeof caseId === "string")),
    );
    const cases = await prisma.testCase.findMany({
      where: { id: { in: uniqueCaseIds }, projectId },
      select: { id: true },
    });

    if (cases.length !== uniqueCaseIds.length) {
      throw new Error("One or more test cases do not belong to this project");
    }

    return uniqueCaseIds;
  }

  if (typeof planId === "string" && planId) {
    const plan = await prisma.testPlan.findFirst({
      where: { id: planId, projectId },
      select: { testCases: { select: { id: true } } },
    });

    if (!plan) throw new Error("Test plan not found");

    const planCaseIds = plan.testCases.map((testCase) => testCase.id);
    if (planCaseIds.length === 0) {
      throw new Error("Selected test plan has no test cases");
    }

    return planCaseIds;
  }

  throw new Error("Provide caseIds or planId to create a test run");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        testRuns: {
          orderBy: { createdAt: "desc" },
          include: {
            results: true,
          },
        },
      },
    });

    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(project.testRuns);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = await req.json();

    // Find project
    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const runCaseIds = await resolveRunCaseIds({
      projectId: project.id,
      caseIds: body.caseIds,
      planId: body.planId,
    });

    // Create Test Run
    const run = await prisma.testRun.create({
      data: {
        title:
          body.title || `Test Run ${new Date().toISOString().split("T")[0]}`,
        description: body.description || "",
        projectId: project.id,
        planId: typeof body.planId === "string" ? body.planId : undefined,
        environmentId:
          typeof body.environmentId === "string" ? body.environmentId : undefined,
        milestoneId:
          typeof body.milestoneId === "string" ? body.milestoneId : undefined,
        results: {
          create: runCaseIds.map((caseId) => ({
            caseId,
            status: "IN_PROGRESS",
          })),
        },
      },
      include: {
        results: true,
      },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create test run",
      },
      { status: error instanceof Error ? 400 : 500 },
    );
  }
}
