import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ code: string, caseId: string }> }) {
  const { code, caseId } = await params;
  try {
    const body = await req.json();
    const { script } = body;

    const testCase = await prisma.testCase.update({
      where: { id: caseId },
      data: { 
        automationScript: script,
        automationStatus: "AUTOMATED"
      }
    });

    return NextResponse.json({ success: true, testCase });

  } catch (error: any) {
    console.error("Save Script failed:", error);
    return NextResponse.json({ error: error.message || "Failed to save script" }, { status: 500 });
  }
}
