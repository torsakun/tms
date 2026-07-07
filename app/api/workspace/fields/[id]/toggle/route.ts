import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, forbidden, unauthorized } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();

  try {
    const { id } = await params;

    const setting = await prisma.workspaceSetting.findUnique({
      where: { key: "disabled_fields" },
    });
    const disabledIds: string[] = setting ? JSON.parse(setting.value) : [];

    const isCurrentlyDisabled = disabledIds.includes(id);
    const newDisabledIds = isCurrentlyDisabled
      ? disabledIds.filter((d) => d !== id)
      : [...disabledIds, id];

    await prisma.workspaceSetting.upsert({
      where: { key: "disabled_fields" },
      update: { value: JSON.stringify(newDisabledIds) },
      create: { key: "disabled_fields", value: JSON.stringify(newDisabledIds) },
    });

    return NextResponse.json({ success: true, isActive: isCurrentlyDisabled });
  } catch (error) {
    console.error("Error toggling field:", error);
    return NextResponse.json(
      { error: "Failed to toggle field" },
      { status: 500 },
    );
  }
}
