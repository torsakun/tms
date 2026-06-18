import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const actualId = resolvedParams.id;

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
