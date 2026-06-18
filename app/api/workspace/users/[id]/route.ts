import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageWorkspace } from "@/lib/permissions";
import bcrypt from "bcrypt";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify current user can manage the workspace (SystemRole ADMIN or Owner/Administrator workspace role)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { workspaceRole: true },
    });

    if (!canManageWorkspace(currentUser)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { id: userId } = await params;
    const body = await req.json();
    const { action, roleId } = body;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "deactivate") {
      // Prevent deactivating oneself
      if (targetUser.id === currentUser.id) {
        return NextResponse.json(
          { error: "Cannot deactivate your own account" },
          { status: 400 },
        );
      }
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "User deactivated successfully",
      });
    }

    if (action === "activate") {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
      return NextResponse.json({
        success: true,
        message: "User activated successfully",
      });
    }

    if (action === "reset_password") {
      const defaultPassword = "password123";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      return NextResponse.json({
        success: true,
        message: "Password reset to default (password123)",
      });
    }

    if (action === "change_role") {
      if (!roleId) {
        return NextResponse.json(
          { error: "Role ID is required" },
          { status: 400 },
        );
      }
      // Check if role exists
      const roleExists = await prisma.workspaceRole.findUnique({
        where: { id: roleId },
      });
      if (!roleExists) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { workspaceRoleId: roleId },
      });
      return NextResponse.json({
        success: true,
        message: "User role updated successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Workspace User Action API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
