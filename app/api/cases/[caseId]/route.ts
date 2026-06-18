// (Phase 2) Backend API Routes
// # CRUD สำหรับ Test Case รายตัว
// app/api/cases/[caseId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: {
      steps: { orderBy: { position: "asc" } },
      author: { select: { name: true, email: true } },
    },
  });
  if (!testCase)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(testCase);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  try {
    const body = await req.json();
    // For steps update, we delete existing and recreate to maintain order easily
    const { steps, ...caseData } = body;

    const updatedCase = await prisma.$transaction(async (tx) => {
      return tx.testCase.update({
        where: { id: caseId },
        data: {
          ...caseData,
          steps: steps
            ? {
                deleteMany: {},
                create: steps.map((s: any) => ({
                  action: s.action,
                  expectedResult: s.expectedResult,
                  position: s.position,
                })),
              }
            : undefined,
        },
        include: { steps: true },
      });
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Test Case Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  await prisma.testCase.delete({ where: { id: caseId } });
  return new NextResponse(null, { status: 204 });
}
