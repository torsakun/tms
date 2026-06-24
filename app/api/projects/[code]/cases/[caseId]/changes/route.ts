import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Field-level change history for a single test case (from the audit log).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { caseId } = await params;
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entity: "TEST_CASE", entityId: caseId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    });

    const changes = logs.map((l) => {
      let parsed: any = null;
      if (l.details) {
        try {
          parsed = JSON.parse(l.details);
        } catch {
          parsed = { note: l.details };
        }
      }
      return {
        id: l.id,
        action: l.action,
        createdAt: l.createdAt,
        user: l.user,
        fields: parsed?.fields || [],
        diff: parsed?.changes || null,
        note: parsed?.note || null,
      };
    });

    return NextResponse.json(changes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch case changes" },
      { status: 500 },
    );
  }
}
