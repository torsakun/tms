import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { cases, suiteId } = body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "No test cases provided" }, { status: 400 });
    }

    // Use transaction to insert multiple test cases and their steps
    const createdCases = await prisma.$transaction(
      cases.map((tc: any) => {
        return prisma.testCase.create({
          data: {
            title: tc.title,
            description: tc.description,
            preconditions: tc.preconditions,
            severity: tc.severity || "NORMAL",
            priority: tc.priority || "MEDIUM",
            automationStatus: "MANUAL",
            projectId: project.id,
            suiteId: suiteId || null,
            tags: {
              connectOrCreate: [{
                where: { name_projectId: { name: "AI-Generated", projectId: project.id } },
                create: { name: "AI-Generated", projectId: project.id }
              }]
            },
            steps: {
              create: (tc.steps || []).map((step: any, idx: number) => ({
                action: step.action,
                expectedResult: step.expectedResult,
                position: idx
              }))
            }
          }
        });
      })
    );

    return NextResponse.json({ success: true, count: createdCases.length });
  } catch (error: any) {
    console.error("Bulk save failed:", error);
    return NextResponse.json({ error: "Failed to save test cases" }, { status: 500 });
  }
}
