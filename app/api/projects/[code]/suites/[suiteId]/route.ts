import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string, suiteId: string }> }) {
  const { code: projectIdOrCode, suiteId } = await params;
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
      return NextResponse.json({ error: "Forbidden: You do not have permission to edit suites in this project" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description } = body;

    const suite = await prisma.testSuite.update({
      where: { id: suiteId },
      data: { title, description }
    });

    return NextResponse.json(suite);
  } catch (error) {
    console.error("Failed to update suite", error);
    return NextResponse.json({ error: "Failed to update suite" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string, suiteId: string }> }) {
  const { code: projectIdOrCode, suiteId } = await params;
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
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete suites in this project" }, { status: 403 });
    }

    await prisma.testSuite.delete({
      where: { id: suiteId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete suite", error);
    return NextResponse.json({ error: "Failed to delete suite" }, { status: 400 });
  }
}
