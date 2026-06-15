import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const project = await prisma.project.findUnique({
      where: { code },
      include: { groups: { select: { id: true } } },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const assignedIds = new Set(project.groups.map((g) => g.id));
    const allGroups = await prisma.group.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { members: true } } },
    });

    return NextResponse.json(
      allGroups.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        memberCount: g._count.members,
        isAssigned: assignedIds.has(g.id),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch project groups", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

    await prisma.project.update({
      where: { code },
      data: { groups: { connect: { id: groupId } } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to assign group to project", error);
    return NextResponse.json({ error: "Failed to assign group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

    await prisma.project.update({
      where: { code },
      data: { groups: { disconnect: { id: groupId } } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove group from project", error);
    return NextResponse.json({ error: "Failed to remove group" }, { status: 500 });
  }
}
