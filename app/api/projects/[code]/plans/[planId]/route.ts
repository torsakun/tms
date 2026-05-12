import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> }
) {
  try {
    const { code, planId } = await params;
    
    const plan = await prisma.testPlan.findUnique({
      where: { id: planId },
      include: {
        testCases: true
      }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching test plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch test plan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> }
) {
  try {
    const { code, planId } = await params;
    const body = await request.json();
    const { title, description, caseIds } = body;

    if (!title || !caseIds || !Array.isArray(caseIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const plan = await prisma.testPlan.update({
      where: { id: planId },
      data: {
        title,
        description,
        testCases: {
          set: caseIds.map((id) => ({ id }))
        }
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating test plan:", error);
    return NextResponse.json(
      { error: "Failed to update test plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; planId: string }> }
) {
  try {
    const { code, planId } = await params;
    
    await prisma.testPlan.delete({
      where: { id: planId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting test plan:", error);
    return NextResponse.json(
      { error: "Failed to delete test plan" },
      { status: 500 }
    );
  }
}
