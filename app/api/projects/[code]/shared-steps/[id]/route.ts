import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { id } = await params;
  try {
    const { title, action, expectedResult } = await req.json();
    const updated = await prisma.sharedStep.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(action !== undefined ? { action } : {}),
        ...(expectedResult !== undefined ? { expectedResult } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update shared step" },
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
    await prisma.sharedStep.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete shared step" },
      { status: 500 },
    );
  }
}
