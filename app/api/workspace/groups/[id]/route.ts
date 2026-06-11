import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update a group: title/description and/or full member set
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: { title?: string; description?: string | null; members?: any } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: "Group name is required" }, { status: 400 });
      data.title = title;
    }
    if (typeof body.description === "string") data.description = body.description.trim() || null;
    if (Array.isArray(body.memberIds)) {
      data.members = { set: body.memberIds.map((mid: string) => ({ id: mid })) };
    }

    const group = await prisma.group.update({
      where: { id },
      data,
      include: {
        _count: { select: { members: true, projects: true } },
        members: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      id: group.id,
      title: group.title,
      description: group.description,
      members: group._count.members,
      projects: group._count.projects,
      memberList: group.members,
    });
  } catch (error) {
    console.error("Failed to update group", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
