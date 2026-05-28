import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const { updates, requirementText } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Execute updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        // Delete old steps
        await tx.testStep.deleteMany({
          where: { caseId: update.id }
        });

        // Update the case and create new steps
        await tx.testCase.update({
          where: { id: update.id },
          data: {
            title: update.title,
            description: update.description,
            preconditions: update.preconditions,
            requirementText: requirementText || update.requirementText,
            isOutdated: false,
            steps: {
              create: update.steps.map((step: any, idx: number) => ({
                action: step.action,
                expectedResult: step.expectedResult,
                position: idx
              }))
            }
          }
        });
      }
    });

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error: any) {
    console.error("Bulk update failed:", error);
    return NextResponse.json({ error: error.message || "Failed to update test cases in bulk" }, { status: 500 });
  }
}
