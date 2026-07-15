import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import { logAudit } from "@/lib/audit-logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: code }, { code }] },
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
      ["ADMIN"],
    );
    if (!hasAccess && (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data: { name?: string; description?: string; isArchived?: boolean } =
      {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.description === "string")
      data.description = body.description;
    if (typeof body.isArchived === "boolean") data.isArchived = body.isArchived;

    const updated = await prisma.project.update({
      where: { id: project.id },
      data,
    });

    if (typeof body.isArchived === "boolean") {
      await logAudit({
        projectId: project.id,
        userId: (session.user as any).id,
        action: "UPDATED",
        entity: "PROJECT",
        entityId: project.id,
        details: `${body.isArchived ? "Archived" : "Restored"} project: ${updated.name}`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update project", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: code }, { code }] },
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
      ["ADMIN"],
    );
    if (!hasAccess && (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Cascades to suites, cases, runs, results, etc. via schema onDelete: Cascade.
    await prisma.project.delete({ where: { id: project.id } });

    return NextResponse.json({ ok: true, deleted: project.code });
  } catch (error) {
    console.error("Failed to delete project", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
