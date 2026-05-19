import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: projectIdOrCode } = await params;
  try {
    const project = await prisma.project.findFirst({
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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(project.code, (session.user as any).id, ['EDITOR', 'ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete test cases in this project" }, { status: 403 });
    }

    const body = await req.json();
    const { caseIds } = body;

    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: "No case IDs provided" }, { status: 400 });
    }

    await prisma.testCase.deleteMany({
      where: {
        id: { in: caseIds },
        projectId: project.id // Ensure we only delete cases within this project
      }
    });

    return NextResponse.json({ success: true, count: caseIds.length });
  } catch (error) {
    console.error("Failed to bulk delete test cases", error);
    return NextResponse.json({ error: "Failed to delete test cases" }, { status: 400 });
  }
}
