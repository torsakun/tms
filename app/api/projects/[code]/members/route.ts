import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import bcrypt from "bcrypt";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { code }
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
        email: true
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(code, (session.user as any).id, ['ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { code }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Upsert User with a default password
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        name: email.split('@')[0], // Default name
      }
    });

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: project.id } }
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    // Create Project Member
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ success: true, member: newMember, message: "User added to project! Default password is 'password123'." });
  } catch (error: any) {
    console.error("Failed to add member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
