import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const triageSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise one-line bug title (max ~120 chars), in Thai with English technical loanwords.",
    ),
  severity: z
    .enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"])
    .describe("Suggested severity based on the failure impact."),
  rootCause: z
    .string()
    .describe("A short likely root-cause hypothesis in Thai."),
  description: z
    .string()
    .describe(
      "A clear bug description in Thai (English loanwords ok), covering what failed and observed behaviour.",
    ),
  stepsToReproduce: z
    .array(z.string())
    .describe("Ordered steps to reproduce, derived from the test case steps."),
});

export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ code: string; runId: string; resultId: string }> },
) {
  try {
    const { resultId } = await params;
    const body = await req.json().catch(() => ({}));
    const modelProvider = body.modelProvider || "openai";

    const result = await prisma.testRunResult.findUnique({
      where: { id: resultId },
      include: {
        testCase: { include: { steps: { orderBy: { position: "asc" } } } },
        testRun: {
          select: { title: true, environment: { select: { title: true } } },
        },
      },
    });
    if (!result) {
      return NextResponse.json(
        { error: "Test result not found" },
        { status: 404 },
      );
    }

    const settings = await prisma.workspaceSetting.findMany({
      where: {
        key: { in: ["OPENAI_API_KEY", "GEMINI_API_KEY", "CLAUDE_API_KEY"] },
      },
    });
    const getSetting = (k: string) => settings.find((s) => s.key === k)?.value;

    let aiModel;
    switch (modelProvider) {
      case "gemini": {
        const key = getSetting("GEMINI_API_KEY");
        if (!key)
          throw new Error(
            "Gemini API Key is not configured in Workspace Settings.",
          );
        aiModel = createGoogleGenerativeAI({ apiKey: key })("gemini-1.5-pro");
        break;
      }
      case "claude": {
        const key = getSetting("CLAUDE_API_KEY");
        if (!key)
          throw new Error(
            "Claude API Key is not configured in Workspace Settings.",
          );
        aiModel = createAnthropic({ apiKey: key })(
          "claude-3-5-sonnet-20241022",
        );
        break;
      }
      default: {
        const key = getSetting("OPENAI_API_KEY");
        if (!key)
          throw new Error(
            "OpenAI API Key is not configured in Workspace Settings.",
          );
        aiModel = createOpenAI({ apiKey: key })("gpt-4o");
        break;
      }
    }

    const tc = result.testCase;
    const stepResults = (result.stepResults as any) || {};
    const stepsText = (tc.steps || [])
      .map((s: any, idx: number) => {
        const sr = stepResults[s.id] || {};
        const actual = sr.actualResult ? ` | Actual: ${sr.actualResult}` : "";
        const st = sr.status ? ` [${sr.status}]` : "";
        return `${idx + 1}. ${s.action}${st}\n   Expected: ${s.expectedResult || "-"}${actual}`;
      })
      .join("\n");

    const { object } = await generateObject({
      model: aiModel,
      schema: triageSchema,
      messages: [
        {
          role: "user",
          content: `You are a Senior QA Engineer triaging a FAILED test execution to draft a bug report for Jira.

TEST RUN: ${result.testRun?.title || "-"}
ENVIRONMENT: ${result.testRun?.environment?.title || "Not specified"}
RESULT STATUS: ${result.status}

TEST CASE: ${tc.title}
PRECONDITIONS: ${tc.preconditions || "-"}
STEPS & RESULTS:
${stepsText || "(no steps recorded)"}

ERROR / FAILURE LOG:
${result.errorMessage || result.comment || "(no explicit error message captured)"}

Draft a clear, actionable bug report. Severity should reflect real impact (BLOCKER = system unusable, CRITICAL = major feature broken, MAJOR = important issue, MINOR/TRIVIAL = small). Write summary/rootCause/description in Thai language with English technical loanwords (Email, Password, API, Button, Database, etc).`,
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("AI triage failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to triage failure" },
      { status: 500 },
    );
  }
}
