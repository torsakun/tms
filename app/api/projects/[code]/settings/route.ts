import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { accessType } = body;

    if (accessType && !["PUBLIC", "PRIVATE"].includes(accessType)) {
      return NextResponse.json({ error: "Invalid accessType" }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { code },
      data: { ...(accessType ? { accessType } : {}) },
    });

    return NextResponse.json({ id: project.id, accessType: project.accessType });
  } catch (error) {
    console.error("Failed to update project settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
