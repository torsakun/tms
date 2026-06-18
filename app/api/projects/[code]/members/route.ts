import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Since the mock db might not have project members yet,
    // we'll just fetch all users for MVP and map them as project members.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const { userId, role } = await req.json();
    if (!userId)
      return NextResponse.json({ error: "userId required" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId, projectId: project.id } },
      update: { role: role || "VIEWER" },
      create: { userId, projectId: project.id, role: role || "VIEWER" },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }
}
