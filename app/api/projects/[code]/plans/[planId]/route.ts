import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> },
) {
  try {
    const { planId } = await params;

    const plan = await prisma.testPlan.findUnique({
      where: { id: planId },
      include: {
        testCases: {
          include: { tags: true },
          orderBy: { sequenceNumber: "asc" },
        },
        testRuns: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: { select: { results: true } },
          },
        },
        project: { select: { code: true, name: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching test plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch test plan" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> },
) {
  try {
    const { code, planId } = await params;
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    const body = await request.json();
    const { title, description, caseIds } = body;

    if (!title || !caseIds || !Array.isArray(caseIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const plan = await prisma.testPlan.update({
      where: { id: planId },
      data: {
        title,
        description,
        testCases: {
          set: caseIds.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating test plan:", error);
    return NextResponse.json(
      { error: "Failed to update test plan" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> },
) {
  try {
    const { code, planId } = await params;
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    await prisma.testPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting test plan:", error);
    return NextResponse.json(
      { error: "Failed to delete test plan" },
      { status: 500 },
    );
  }
}
