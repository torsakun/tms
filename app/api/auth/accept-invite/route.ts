import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation is already accepted or expired" },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName =
      `${invitation.firstName || ""} ${invitation.lastName || ""}`.trim() ||
      invitation.email.split("@")[0];

    // Find the default WorkspaceRole in case invitation.roleId is missing
    const defaultRole = await prisma.workspaceRole.findFirst({
      where: { isDefault: true },
    });

    const assignedRoleId = invitation.roleId || defaultRole?.id;

    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: fullName,
        passwordHash,
        role: "USER", // Default SystemRole
        workspaceRoleId: assignedRoleId,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 },
    );
  }
}
