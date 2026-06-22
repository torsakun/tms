import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { id } = await params;
  try {
    const { title, description, slug } = await req.json();
    const updated = await prisma.environment.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(slug !== undefined ? { slug } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update environment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.environment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete environment" },
      { status: 500 },
    );
  }
}
