import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, forbidden, unauthorized } from "@/lib/api-auth";
import { canManageRoles } from "@/lib/permissions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageRoles(actor)) return forbidden();

  try {
    const resolvedParams = await params;
    const actualId = resolvedParams.id;

    const role = await prisma.workspaceRole.findUnique({
      where: { id: actualId },
      select: { id: true },
    });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Set all roles isDefault to false, then set this one to true
    await prisma.$transaction([
      prisma.workspaceRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      }),
      prisma.workspaceRole.update({
        where: { id: actualId },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set default role:", error);
    return NextResponse.json(
      { error: "Failed to set default role" },
      { status: 500 },
    );
  }
}
