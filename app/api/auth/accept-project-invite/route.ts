import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      // Clean up expired
      await prisma.projectInvitation.delete({ where: { id: invitation.id } });
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      if (!password || !name) {
        return NextResponse.json(
          { error: "Name and password are required for new users" },
          { status: 400 },
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          name,
          passwordHash,
          role: "USER", // System role
        },
      });
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: user.id, projectId: invitation.projectId },
      },
    });

    if (!existingMember) {
      await prisma.projectMember.create({
        data: {
          userId: user.id,
          projectId: invitation.projectId,
          role: invitation.role,
        },
      });
    }

    // Delete the invitation
    await prisma.projectInvitation.delete({ where: { id: invitation.id } });

    return NextResponse.json({
      success: true,
      projectCode: invitation.project.code,
    });
  } catch (error: any) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
