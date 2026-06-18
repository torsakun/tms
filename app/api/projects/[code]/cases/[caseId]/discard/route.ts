import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { code, caseId } = await params;
  try {
    const updatedCase = await prisma.testCase.update({
      where: { id: caseId, project: { code } },
      data: {
        automationScript: null,
        automationStatus: "MANUAL",
      },
    });

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error: any) {
    console.error("Failed to discard generated script:", error);
    return NextResponse.json(
      { error: "Failed to discard script" },
      { status: 500 },
    );
  }
}
