import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ code: string, caseId: string }> }) {
  const { code, caseId } = await params;
  try {
    const body = await req.json();
    const { domContext, modelProvider = "openai" } = body;

    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { steps: { orderBy: { position: 'asc' } } }
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
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

    const stepsText = testCase.steps.map((s, i) => `Step ${i + 1}: ${s.action} (Expected: ${s.expectedResult || "N/A"})`).join("\n");

    const systemPrompt = `You are a Senior QA Automation Engineer.
Your task is to write a Playwright TypeScript automation script for the provided Manual Test Case.

Guidelines:
1. Write cleanly structured Playwright code using the @playwright/test framework.
2. Prioritize Semantic Locators. If the DOM context is provided, carefully examine the HTML to find the exact \`placeholder\`, \`aria-label\`, or \`class\` to target.
3. If specific locators are unknown, use creative fallbacks like \`getByPlaceholder\`, \`getByText\`, or \`locator('input[type="text"]')\` rather than rigid \`getByRole\` names that might not exist.
4. Include assertions (expect) based on the "Expected Results".
5. ALWAYS use 'http://localhost:3000' as the base URL for page.goto() (e.g. \`page.goto('http://localhost:3000/login')\`). Do NOT use production or vercel URLs.
6. Return ONLY the TypeScript code block. Do not include markdown formatting like \`\`\`typescript, just the raw code.

Test Case Title: ${testCase.title}
Preconditions: ${testCase.preconditions || "None"}

Manual Steps:
${stepsText}

${domContext ? `Page HTML / DOM Snippet:\n${domContext}\n\nUse this DOM context to extract exact locators if applicable.` : ""}
`;

    const { text } = await generateText({
      model: aiModel,
      prompt: systemPrompt,
    });

    // Remove markdown code block wrappers if the AI included them anyway
    const cleanText = text.replace(/^```(typescript|ts)?\n/i, '').replace(/```$/i, '').trim();

    return NextResponse.json({ script: cleanText });

  } catch (error: any) {
    console.error("AI Script Generation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate script" }, { status: 500 });
  }
}
