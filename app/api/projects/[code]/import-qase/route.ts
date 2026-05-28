import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const parseSeverity = (sev: string | undefined) => {
  if (!sev) return "NORMAL";
  const upper = sev.toUpperCase();
  if (['NOT_SET', 'BLOCKER', 'CRITICAL', 'MAJOR', 'NORMAL', 'MINOR', 'TRIVIAL'].includes(upper)) return upper;
  return "NORMAL";
};

const parsePriority = (pri: string | undefined) => {
  if (!pri || pri === 'undefined') return "NOT_SET";
  const upper = pri.toUpperCase();
  if (['NOT_SET', 'HIGH', 'MEDIUM', 'LOW'].includes(upper)) return upper;
  return "NOT_SET";
};

const parseAutomation = (auto: string | undefined) => {
  if (auto === 'to-be-automated') return 'TO_BE_AUTOMATED';
  if (auto === 'is-automated') return 'AUTOMATED';
  return 'MANUAL';
};

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const reqBody = await req.json();
    
    const body = reqBody.payload || reqBody;
    const rootParentId = reqBody.parentId || null;
    const replaceMatching = reqBody.replaceMatching || false;

    if (!body || !Array.isArray(body.suites)) {
      return NextResponse.json({ error: "Invalid Qase JSON format. Expected { suites: [...] }" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const processSuites = async (suites: any[], parentId: string | null) => {
        for (const suite of suites) {
          let newSuiteId;

          // If replaceMatching is true and it's a top level suite, we might check if suite with same name exists?
          // Actually, replacing matching cases is complex. For now, we will just always create new suites.
          const newSuite = await tx.testSuite.create({
            data: {
              title: suite.title,
              description: suite.description || null,
              projectId: project.id,
              parentId: parentId,
            }
          });
          newSuiteId = newSuite.id;

          if (suite.cases && Array.isArray(suite.cases)) {
            for (const tc of suite.cases) {
              await tx.testCase.create({
                data: {
                  title: tc.title,
                  description: tc.description || null,
                  preconditions: tc.preconditions || null,
                  postconditions: tc.postconditions || null,
                  severity: parseSeverity(tc.severity) as any,
                  priority: parsePriority(tc.priority) as any,
                  automationStatus: parseAutomation(tc.automation) as any,
                  projectId: project.id,
                  suiteId: newSuiteId,
                  steps: {
                    create: (tc.steps || []).map((step: any, idx: number) => ({
                      position: step.position || idx + 1,
                      action: step.action || "",
                      expectedResult: step.expected_result || null
                    }))
                  }
                }
              });
            }
          }

          if (suite.suites && Array.isArray(suite.suites)) {
            await processSuites(suite.suites, newSuiteId);
          }
        }
      };

      await processSuites(body.suites, rootParentId);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to import qase:", error);
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}
