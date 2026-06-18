import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { code, caseId } = await params;
  try {
    const body = await req.json();
    const { script, errorLog, domContext, modelProvider = "openai" } = body;

    if (!script || !errorLog) {
      return NextResponse.json(
        { error: "Script and error log are required" },
        { status: 400 },
      );
    }

    // Fetch test case steps to provide context to the AI
    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { steps: { orderBy: { position: "asc" } } },
    });

    const stepsText =
      testCase?.steps
        .map(
          (s, i) =>
            `Step ${i + 1}: ${s.action} (Expected: ${s.expectedResult || "N/A"})`,
        )
        .join("\n") || "No steps available.";

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
        if (!geminiKey) throw new Error("Gemini API Key is not configured.");
        const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = googleProvider("gemini-1.5-pro");
        break;
      case "claude":
        const claudeKey = getSetting("CLAUDE_API_KEY");
        if (!claudeKey) throw new Error("Claude API Key is not configured.");
        const anthropicProvider = createAnthropic({ apiKey: claudeKey });
        aiModel = anthropicProvider("claude-3-5-sonnet-20241022");
        break;
      case "openai":
      default:
        const openaiKey = getSetting("OPENAI_API_KEY");
        if (!openaiKey) throw new Error("OpenAI API Key is not configured.");
        const openaiProvider = createOpenAI({ apiKey: openaiKey });
        aiModel = openaiProvider("gpt-4o");
        break;
    }

    // Truncate domContext if it's too large to avoid token limit errors (30k TPM limit for gpt-4o in some orgs)
    const MAX_DOM_LENGTH = 50000;
    const truncatedDom =
      domContext && domContext.length > MAX_DOM_LENGTH
        ? domContext.substring(0, MAX_DOM_LENGTH) +
          "\n...[DOM TRUNCATED DUE TO SIZE]..."
        : domContext;

    const systemPrompt = `You are an expert QA Automation Engineer.
You are tasked with fixing a broken Playwright script. The script failed during execution with the provided error log.

Here are the ORIGINAL MANUAL TEST STEPS for context on what the script is trying to achieve:
${stepsText}

Here is the CURRENT BROKEN SCRIPT:
\`\`\`typescript
${script}
\`\`\`

Here is the PLAYWRIGHT ERROR LOG:
\`\`\`
${errorLog}
\`\`\`

${truncatedDom ? `Here is the PAGE HTML / DOM SNIPPET:\n\`\`\`html\n${truncatedDom}\n\`\`\`\nUse this to find the correct locators for the failing element.` : `Note: No DOM context was provided. If the error is a locator timeout (e.g., getByLabel failed), you MUST try an alternative semantic locator such as page.getByPlaceholder(), page.getByRole(), or a fallback CSS selector like page.locator('input[type="email"]'). Do not just return the exact same script.`}

Analyze the error log, identify why the script failed (e.g. wrong locator, timeout, syntax error), and provide the FIXED script.
CRITICAL RULES:
1. ONLY return the fully corrected TypeScript code block. Do not provide explanations or markdown \`\`\` wrappers.
2. In Playwright, ALWAYS use page.getByLabel() instead of getByLabelText().
3. If the DOM context is provided, carefully examine the HTML to find the exact \`placeholder\`, \`aria-label\`, or \`class\` to target.
4. If a locator fails, DO NOT stubbornly try the exact same locator. Be creative: try \`getByPlaceholder\`, \`locator('input[type="text"]')\`, or use exact text matching.
5. If the script seems stuck on the wrong page (e.g., trying to search before logging in), you are allowed to inject necessary prerequisite steps (like filling username/password and waiting for navigation).
6. Compare the current script against the ORIGINAL MANUAL TEST STEPS. If the script is missing actions (e.g., missing a click on a menu item before typing in a search box), you MUST rewrite the script to explicitly include every manual step. Do not skip steps!
7. If the error is a "strict mode violation" (resolved to multiple elements), you MUST fix it by either adding \`{ exact: true }\` to the locator (e.g., \`getByRole('link', { name: 'Projects', exact: true })\`) or by appending \`.first()\` / \`.nth(0)\` to the locator.
`;

    const { text } = await generateText({
      model: aiModel,
      prompt: systemPrompt,
    });

    const cleanText = text
      .replace(/^```(typescript|ts)?\n/i, "")
      .replace(/```$/i, "")
      .trim();

    return NextResponse.json({ script: cleanText });
  } catch (error: any) {
    console.error("AI Script Fix failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix script" },
      { status: 500 },
    );
  }
}
