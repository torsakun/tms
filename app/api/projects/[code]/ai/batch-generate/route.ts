import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await req.json();
    const { caseIds, modelProvider = "openai" } = body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: "No caseIds provided" }, { status: 400 });
    }

    // Fetch API keys from DB
    const settings = await prisma.workspaceSetting.findMany({
      where: {
        key: { in: ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'CLAUDE_API_KEY'] }
      }
    });
    
    const getSetting = (k: string) => settings.find(s => s.key === k)?.value;

    let aiModel;
    switch (modelProvider) {
      case "gemini":
        const geminiKey = getSetting('GEMINI_API_KEY');
        if (!geminiKey) throw new Error("Gemini API Key is not configured in Workspace Settings.");
        const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = googleProvider('gemini-1.5-pro');
        break;
      case "claude":
        const claudeKey = getSetting('CLAUDE_API_KEY');
        if (!claudeKey) throw new Error("Claude API Key is not configured in Workspace Settings.");
        const anthropicProvider = createAnthropic({ apiKey: claudeKey });
        aiModel = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      case "openai":
      default:
        const openaiKey = getSetting('OPENAI_API_KEY');
        if (!openaiKey) throw new Error("OpenAI API Key is not configured in Workspace Settings.");
        const openaiProvider = createOpenAI({ apiKey: openaiKey });
        aiModel = openaiProvider('gpt-4o');
        break;
    }

    const results = [];

    // Process each case sequentially to avoid rate limits
    for (const caseId of caseIds) {
      try {
        const testCase = await prisma.testCase.findUnique({
          where: { id: caseId },
          include: { steps: { orderBy: { position: 'asc' } } }
        });

        if (!testCase) {
          results.push({ caseId, status: "failed", error: "Not found" });
          continue;
        }

        const stepsText = testCase.steps.map((s, i) => `Step ${i + 1}: ${s.action} (Expected: ${s.expectedResult || "N/A"})`).join("\n");

        const systemPrompt = `You are a Senior QA Automation Engineer.
Your task is to write a Playwright TypeScript automation script for the provided Manual Test Case.

Guidelines:
1. Write cleanly structured Playwright code using the @playwright/test framework.
2. Prioritize Semantic Locators (e.g. getByRole, getByLabel, getByText).
3. If specific locators are unknown, use clear placeholder variables (e.g. \`const emailInput = 'TODO_LOCATOR';\`).
4. Include assertions (expect) based on the "Expected Results".
5. Return ONLY the TypeScript code block. Do not include markdown formatting like \`\`\`typescript, just the raw code.

Test Case Title: ${testCase.title}
Preconditions: ${testCase.preconditions || "None"}

Manual Steps:
${stepsText}
`;

        const { text } = await generateText({
          model: aiModel,
          prompt: systemPrompt,
        });

        const cleanText = text.replace(/^```(typescript|ts)?\n/i, '').replace(/```$/i, '').trim();

        // Save to DB
        await prisma.testCase.update({
          where: { id: caseId },
          data: {
            automationScript: cleanText,
            automationStatus: "TO_BE_AUTOMATED"
          }
        });

        results.push({ caseId, status: "success" });
      } catch (err: any) {
        console.error(`Failed to generate for case ${caseId}:`, err);
        results.push({ caseId, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Batch AI Generation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate scripts" }, { status: 500 });
  }
}
