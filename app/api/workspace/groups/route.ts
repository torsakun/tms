import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";

// List all groups with counts + members
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { members: true, projects: true } },
        members: { select: { id: true, name: true, email: true } },
        projects: { select: { id: true, name: true, code: true } },
      },
    });

    const result = groups.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      members: g._count.members,
      projects: g._count.projects,
      memberList: g.members,
      projectList: g.projects,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch groups", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// Create a group
export async function POST(req: NextRequest) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();
  try {
    const body = await req.json();
    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        title,
        description: body.description?.trim() || null,
        members: Array.isArray(body.memberIds) && body.memberIds.length
          ? { connect: body.memberIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: { _count: { select: { members: true, projects: true } } },
    });

    return NextResponse.json({
      id: group.id,
      title: group.title,
      description: group.description,
      members: group._count.members,
      projects: group._count.projects,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create group", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
