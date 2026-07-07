import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";
import { ProjectRole } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; userId: string }> },
) {
  try {
    const { code, userId } = await params;
    const access = await requireProjectAccess(code, [ProjectRole.ADMIN]);
    if (access instanceof NextResponse) return access;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await prisma.projectMember.deleteMany({
      where: { userId, projectId: project.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
