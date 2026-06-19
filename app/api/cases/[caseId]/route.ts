// (Phase 2) Backend API Routes
// # CRUD สำหรับ Test Case รายตัว
// app/api/cases/[caseId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const session = await getServerSession(authOptions);
    const actorId = session?.user ? (session.user as any).id : null;

    const existingCase = await prisma.testCase.findUnique({
      where: { id: caseId }
    });

    const updatedCase = await prisma.$transaction(async (tx) => {
      const updated = await tx.testCase.update({
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
        include: { steps: true, author: true },
      });

      // Notification Logic: If authorId (assignee) changed
      if (
        caseData.authorId && 
        existingCase && 
        existingCase.authorId !== caseData.authorId &&
        caseData.authorId !== actorId // Don't notify if assigning to self
      ) {
        await tx.notification.create({
          data: {
            recipientId: caseData.authorId,
            actorId: actorId,
            type: "ASSIGNMENT",
            entityId: updated.id,
            title: "Assigned Test Case",
            message: `You have been assigned to test case: ${updated.title}`,
          }
        });
      }

      return updated;
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
