import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { code }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId }
    });

    if (!testCase || testCase.projectId !== project.id) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    // Delete the test case
    await prisma.testCase.delete({
      where: { id: caseId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete test case:", error);
    return NextResponse.json({ error: error.message || "Failed to delete test case" }, { status: 500 });
  }
}
