import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, options, isRequired, isGlobal, projectIds, order } = body;

    const isGlobalVal = isGlobal !== false;
    const isSystemField = id.startsWith('sys-');

    if (isSystemField) {
      // Upsert system field override into DB — create on first edit, update thereafter
      const field = await prisma.customField.upsert({
        where: { id },
        create: {
          id,
          name: name || id,
          type: type || 'SELECT',
          options: options || null,
          isRequired: !!isRequired,
          isGlobal: true,
          isSystem: true,
          order: order ?? 0,
          entity: 'TestCase',
        },
        update: {
          name,
          isRequired: !!isRequired,
          order: order ?? undefined,
        },
      });
      return NextResponse.json(field);
    }

    const field = await prisma.customField.update({
      where: { id },
      data: {
        name,
        type,
        options: options || null,
        isRequired: !!isRequired,
        isGlobal: isGlobalVal,
        order: order ?? undefined,
        projects: {
          set: (!isGlobalVal && Array.isArray(projectIds))
            ? projectIds.map((pid: string) => ({ id: pid }))
            : []
        }
      }
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error updating custom field:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();
  try {
    const { id } = await params;

    const field = await prisma.customField.findUnique({
      where: { id },
      include: { projects: true }
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    if (field.isGlobal || field.projects.length > 0) {
      return NextResponse.json({ error: "Cannot delete field that is assigned to projects. Please unassign it first by setting it to 0 projects." }, { status: 400 });
    }

    await prisma.customField.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
