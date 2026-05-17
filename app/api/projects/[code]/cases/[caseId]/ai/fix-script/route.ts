import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ code: string, caseId: string }> }) {
  const { code, caseId } = await params;
  try {
    const body = await req.json();
    const { script, errorLog, modelProvider = "openai" } = body;

    if (!script || !errorLog) {
      return NextResponse.json({ error: "Script and error log are required" }, { status: 400 });
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
        if (!geminiKey) throw new Error("Gemini API Key is not configured.");
        const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = googleProvider('gemini-1.5-pro');
        break;
      case "claude":
        const claudeKey = getSetting('CLAUDE_API_KEY');
        if (!claudeKey) throw new Error("Claude API Key is not configured.");
        const anthropicProvider = createAnthropic({ apiKey: claudeKey });
        aiModel = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      case "openai":
      default:
        const openaiKey = getSetting('OPENAI_API_KEY');
        if (!openaiKey) throw new Error("OpenAI API Key is not configured.");
        const openaiProvider = createOpenAI({ apiKey: openaiKey });
        aiModel = openaiProvider('gpt-4o');
        break;
    }

    const systemPrompt = `You are an expert QA Automation Engineer.
You are tasked with fixing a broken Playwright script. The script failed during execution with the provided error log.

Here is the CURRENT BROKEN SCRIPT:
\`\`\`typescript
${script}
\`\`\`

Here is the PLAYWRIGHT ERROR LOG:
\`\`\`
${errorLog}
\`\`\`

${domContext ? `Here is the PAGE HTML / DOM SNIPPET:\n\`\`\`html\n${domContext}\n\`\`\`\nUse this to find the correct locators for the failing element.` : `Note: No DOM context was provided. If the error is a locator timeout (e.g., getByLabel failed), you MUST try an alternative semantic locator such as page.getByPlaceholder(), page.getByRole(), or a fallback CSS selector like page.locator('input[type="email"]'). Do not just return the exact same script.`}

Analyze the error log, identify why the script failed (e.g. wrong locator, timeout, syntax error), and provide the FIXED script.
CRITICAL RULES:
1. ONLY return the fully corrected TypeScript code block. Do not provide explanations or markdown \`\`\` wrappers.
2. In Playwright, ALWAYS use page.getByLabel() instead of getByLabelText().
3. Do not modify the overall test structure, only fix the specific lines that caused the error.
`;

    const { text } = await generateText({
      model: aiModel,
      prompt: systemPrompt,
    });

    const cleanText = text.replace(/^```(typescript|ts)?\n/i, '').replace(/```$/i, '').trim();

    return NextResponse.json({ script: cleanText });

  } catch (error: any) {
    console.error("AI Script Fix failed:", error);
    return NextResponse.json({ error: error.message || "Failed to fix script" }, { status: 500 });
  }
}
