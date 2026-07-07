import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/project-route-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { code, id } = await params;
  try {
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    const { title, description, dueDate, status } = await req.json();
    const updated = await prisma.milestone.update({
      where: { id, project: { code } },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { code, id } = await params;
  try {
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    await prisma.milestone.delete({ where: { id, project: { code } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 },
    );
  }
}
