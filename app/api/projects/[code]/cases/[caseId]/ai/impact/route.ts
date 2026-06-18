import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const impactSchema = z.object({
  analysis: z
    .string()
    .describe(
      "A brief explanation in Thai of how the requirement change impacts this test case.",
    ),
  needsUpdate: z
    .boolean()
    .describe(
      "Whether the test case needs to be updated or not based on the new requirement.",
    ),
  suggestedUpdates: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      preconditions: z.string().optional(),
      steps: z
        .array(
          z.object({
            action: z.string(),
            expectedResult: z.string(),
          }),
        )
        .optional(),
    })
    .describe(
      "Suggested new values for the test case if needsUpdate is true. MUST BE IN THAI LANGUAGE with English technical loanwords.",
    ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  try {
    const { caseId } = await params;
    const body = await req.json();
    const { newRequirementText, modelProvider } = body;

    if (!newRequirementText) {
      return NextResponse.json(
        { error: "newRequirementText is required" },
        { status: 400 },
      );
    }

    // Fetch the test case to get baseline requirement and current steps
    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { steps: { orderBy: { position: "asc" } } },
    });

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 },
      );
    }

    // Fetch API keys from DB
    const settings = await prisma.workspaceSetting.findMany({
      where: {
        key: { in: ["OPENAI_API_KEY", "GEMINI_API_KEY", "CLAUDE_API_KEY"] },
      },
    });

    const getSetting = (k: string) => settings.find((s) => s.key === k)?.value;

    let aiModel;
    switch (modelProvider) {
      case "gemini":
        const geminiKey = getSetting("GEMINI_API_KEY");
        if (!geminiKey)
          throw new Error(
            "Gemini API Key is not configured in Workspace Settings.",
          );
        const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = googleProvider("gemini-1.5-pro");
        break;
      case "claude":
        const claudeKey = getSetting("CLAUDE_API_KEY");
        if (!claudeKey)
          throw new Error(
            "Claude API Key is not configured in Workspace Settings.",
          );
        const anthropicProvider = createAnthropic({ apiKey: claudeKey });
        aiModel = anthropicProvider("claude-3-5-sonnet-20241022");
        break;
      case "openai":
      default:
        const openaiKey = getSetting("OPENAI_API_KEY");
        if (!openaiKey)
          throw new Error(
            "OpenAI API Key is not configured in Workspace Settings.",
          );
        const openaiProvider = createOpenAI({ apiKey: openaiKey });
        aiModel = openaiProvider("gpt-4o");
        break;
    }

    const { object } = await generateObject({
      model: aiModel,
      schema: impactSchema,
      messages: [
        {
          role: "user",
          content: `You are an expert Senior QA Engineer. The requirement for a Jira issue has changed.
Your task is to analyze the difference between the Old Requirement and the New Requirement, and determine how it impacts the provided Existing Test Case.

OLD REQUIREMENT:
${testCase.requirementText || "(No baseline requirement text found)"}

NEW REQUIREMENT:
${newRequirementText}

EXISTING TEST CASE:
Title: ${testCase.title}
Description: ${testCase.description || ""}
Preconditions: ${testCase.preconditions || ""}
Steps:
${testCase.steps.map((s, idx) => `${idx + 1}. Action: ${s.action} \nExpected: ${s.expectedResult || ""}`).join("\n")}

Analyze if the Existing Test Case needs to be modified to align with the New Requirement. 
If it does, provide the suggested updates (title, description, preconditions, and full list of steps).
Ensure the updates are entirely in the Thai language but maintain English technical terms as loanwords (e.g. Email, Password, Input, API, Database, Button).`,
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("AI Impact Analysis failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze impact" },
      { status: 500 },
    );
  }
}
