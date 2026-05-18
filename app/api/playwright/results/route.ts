import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingTestResult = {
  caseKey?: string;
  title: string;
  status: string;
  durationMs?: number;
  logs?: string;
  errorMessage?: string;
  file?: string;
  line?: number;
};

const allowedStatuses = new Set(["PASSED", "FAILED", "BLOCKED", "SKIPPED", "IN_PROGRESS"]);

function extractCaseKey(title: string) {
  const bracketMatch = title.match(/\[([A-Z][A-Z0-9_-]*-\d+)\]/i);
  if (bracketMatch?.[1]) return bracketMatch[1].toUpperCase();

  const tagMatch = title.match(/@([A-Z][A-Z0-9_-]*-\d+)/i);
  if (tagMatch?.[1]) return tagMatch[1].toUpperCase();

  return null;
}

function normalizeStatus(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PASS" || normalized === "PASSED") return "PASSED";
  if (normalized === "FAIL" || normalized === "FAILED" || normalized === "TIMEDOUT" || normalized === "INTERRUPTED") return "FAILED";
  if (normalized === "SKIP" || normalized === "SKIPPED") return "SKIPPED";
  if (normalized === "BLOCK" || normalized === "BLOCKED") return "BLOCKED";
  if (normalized === "RUNNING" || normalized === "IN_PROGRESS") return "IN_PROGRESS";
  return allowedStatuses.has(normalized) ? normalized : "FAILED";
}

function buildCleanTitle(title: string, caseKey: string | null) {
  if (!caseKey) return title.trim();
  return title
    .replace(new RegExp(`\\[${caseKey}\\]`, "i"), "")
    .replace(new RegExp(`@${caseKey}`, "i"), "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const expectedSecret = process.env.PLAYWRIGHT_WEBHOOK_SECRET;
    if (expectedSecret) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "");
      if (token !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const projectCode = String(body.projectCode || "").trim();
    const runId = body.runId ? String(body.runId) : undefined;
    const runTitle = String(body.runTitle || "Playwright Automated Run").trim();
    const results: IncomingTestResult[] = Array.isArray(body.tests)
      ? body.tests
      : [{
          caseKey: body.caseKey,
          title: body.title,
          status: body.status,
          durationMs: body.durationMs,
          logs: body.logs,
          errorMessage: body.errorMessage,
          file: body.file,
          line: body.line
        }];

    if (!projectCode) {
      return NextResponse.json({ error: "projectCode is required" }, { status: 400 });
    }

    const validResults = results.filter((result) => result.title && result.status);
    if (validResults.length === 0) {
      return NextResponse.json({ error: "At least one test result with title and status is required" }, { status: 400 });
    }

    let project = await prisma.project.findUnique({
      where: { code: projectCode }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          code: projectCode,
          name: `${projectCode} Project`
        }
      });
    }

    const run = runId
      ? await prisma.testRun.findFirst({
          where: { id: runId, projectId: project.id }
        })
      : await prisma.testRun.findFirst({
          where: {
            projectId: project.id,
            title: runTitle,
            status: "ACTIVE"
          }
        });

    const testRun = run || await prisma.testRun.create({
      data: {
        title: runTitle,
        description: "Created from Playwright reporter",
        projectId: project.id,
        status: "ACTIVE"
      }
    });

    const savedResults = [];

    for (const result of validResults) {
      const caseKey = result.caseKey?.trim().toUpperCase() || extractCaseKey(result.title);
      const title = buildCleanTitle(result.title, caseKey);
      const status = normalizeStatus(result.status) as "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED" | "IN_PROGRESS";

      let testCase = await prisma.testCase.findFirst({
        where: {
          projectId: project.id,
          OR: [
            { title },
            ...(caseKey ? [{ customFields: { path: ["automationKey"], equals: caseKey } }] : [])
          ]
        }
      });

      if (!testCase) {
        testCase = await prisma.testCase.create({
          data: {
            title,
            description: result.file ? `Imported from Playwright: ${result.file}${result.line ? `:${result.line}` : ""}` : "Imported from Playwright",
            projectId: project.id,
            automationStatus: "AUTOMATED",
            customFields: caseKey ? { automationKey: caseKey } : undefined
          }
        });
      }

      const existingRunResult = await prisma.testRunResult.findUnique({
        where: {
          runId_caseId: {
            runId: testRun.id,
            caseId: testCase.id
          }
        },
        select: {
          id: true,
          executionHistory: true
        }
      });

      const history = Array.isArray(existingRunResult?.executionHistory)
        ? existingRunResult.executionHistory
        : [];

      const historyItem = {
        timestamp: new Date().toISOString(),
        status,
        durationMs: result.durationMs || 0,
        logs: result.logs || "",
        errorMessage: result.errorMessage || null,
        file: result.file || null,
        line: result.line || null
      };

      const runResult = existingRunResult
        ? await prisma.testRunResult.update({
            where: { id: existingRunResult.id },
            data: {
              status,
              timeSpent: result.durationMs,
              errorMessage: result.errorMessage || null,
              comment: result.logs || null,
              executionHistory: [...history, historyItem]
            }
          })
        : await prisma.testRunResult.create({
            data: {
              runId: testRun.id,
              caseId: testCase.id,
              status,
              timeSpent: result.durationMs,
              errorMessage: result.errorMessage || null,
              comment: result.logs || null,
              executionHistory: [historyItem]
            }
          });

      savedResults.push({
        caseId: testCase.id,
        caseKey,
        title: testCase.title,
        resultId: runResult.id,
        status
      });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        code: project.code
      },
      run: {
        id: testRun.id,
        title: testRun.title
      },
      results: savedResults
    });
  } catch (error: unknown) {
    console.error("Playwright result ingestion failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save Playwright results";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
