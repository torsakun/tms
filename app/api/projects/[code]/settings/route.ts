import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only project admins (or system admins) may change project settings.
    const allowed = await requireProjectRole(
      code,
      (session.user as any).id,
      ["ADMIN"],
    );
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You must be a project admin to change these settings",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { accessType } = body;

    if (accessType && !["PUBLIC", "PRIVATE"].includes(accessType)) {
      return NextResponse.json(
        { error: "Invalid accessType" },
        { status: 400 },
      );
    }

    const project = await prisma.project.update({
      where: { code },
      data: { ...(accessType ? { accessType } : {}) },
    });

    return NextResponse.json({
      id: project.id,
      accessType: project.accessType,
    });
  } catch (error) {
    console.error("Failed to update project settings", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
