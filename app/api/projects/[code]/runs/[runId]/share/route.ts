import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectRole } from "@/lib/project-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; runId: string }> },
) {
  try {
    const { code, runId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const role = await getProjectRole(code, user.id);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { code: code },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { isPublic } = await req.json();

    const run = await prisma.testRun.update({
      where: { id: runId, projectId: project.id },
      data: { isPublic },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Failed to update test run share status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
