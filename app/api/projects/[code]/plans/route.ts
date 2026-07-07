import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;

    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const plans = await prisma.testPlan.findMany({
      where: { projectId: project.id },
      include: {
        _count: {
          select: { testCases: true, testRuns: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching test plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch test plans" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    const body = await request.json();
    const { title, description, caseIds } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const plan = await prisma.testPlan.create({
      data: {
        title,
        description,
        projectId: project.id,
        testCases:
          caseIds && caseIds.length > 0
            ? {
                connect: caseIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        testCases: true,
        _count: {
          select: { testCases: true, testRuns: true },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating test plan:", error);
    return NextResponse.json(
      { error: "Failed to create test plan" },
      { status: 500 },
    );
  }
}
