import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageRoles } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const role = await prisma.workspaceRole.findUnique({
      where: { id },
    });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, role });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageRoles(actor)) return forbidden();
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { title, description, isDefault, permissions } = body;

    const existingRole = await prisma.workspaceRole.findUnique({
      where: { id },
    });
    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (isDefault) {
      await prisma.workspaceRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedRole = await prisma.workspaceRole.update({
      where: { id },
      data: {
        title: title || existingRole.title,
        description,
        isDefault,
        permissions: permissions || existingRole.permissions,
      },
    });

    return NextResponse.json({ success: true, role: updatedRole });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageRoles(actor)) return forbidden();
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existingRole = await prisma.workspaceRole.findUnique({
      where: { id },
    });
    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole.isDefault) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the default role. Set another role as default first.",
        },
        { status: 400 },
      );
    }

    await prisma.workspaceRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
