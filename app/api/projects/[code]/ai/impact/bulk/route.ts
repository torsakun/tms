import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const impactSchema = z.object({
  analysis: z.string().describe("A brief explanation in Thai of how the requirement change impacts this test case."),
  needsUpdate: z.boolean().describe("Whether the test case needs to be updated or not based on the new requirement."),
  suggestedUpdates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    preconditions: z.string().optional(),
    steps: z.array(
      z.object({
        action: z.string(),
        expectedResult: z.string()
      })
    ).optional()
  }).describe("Suggested new values for the test case if needsUpdate is true. MUST BE IN THAI LANGUAGE with English technical loanwords.")
});

// Helper function to chunk array to avoid rate limiting
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const { newRequirementText, modelProvider, caseIds } = body;

    if (!newRequirementText || !caseIds || !Array.isArray(caseIds)) {
      return NextResponse.json({ error: "newRequirementText and an array of caseIds are required" }, { status: 400 });
    }

    if (caseIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch the test cases
    const testCases = await prisma.testCase.findMany({
      where: { id: { in: caseIds } },
      include: { steps: { orderBy: { position: 'asc' } } }
    });

    if (testCases.length === 0) {
      return NextResponse.json({ error: "No valid test cases found" }, { status: 404 });
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

    // Process in chunks of 5 to avoid API rate limits and connection timeouts
    const chunks = chunkArray(testCases, 5);
    const allResults = [];

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (testCase) => {
        try {
          const { object } = await generateObject({
            model: aiModel,
            schema: impactSchema,
            messages: [
              {
                role: 'user',
                content: `You are an expert Senior QA Engineer. The requirement for a Jira Story/Ticket has changed.
Your task is to analyze how the New Requirement impacts the provided Existing Test Case.

NEW REQUIREMENT:
${newRequirementText}

EXISTING TEST CASE:
Title: ${testCase.title}
Description: ${testCase.description || ""}
Preconditions: ${testCase.preconditions || ""}
Steps:
${testCase.steps.map((s, idx) => `${idx + 1}. Action: ${s.action} \nExpected: ${s.expectedResult || ""}`).join('\n')}

Analyze if the Existing Test Case needs to be modified to align with the New Requirement. 
If it does, provide the suggested updates. If the test case is completely unrelated to the new requirement, needsUpdate should be false.
Ensure the updates are entirely in the Thai language but maintain English technical terms as loanwords.`
              }
            ]
          });
          
          return {
            caseId: testCase.id,
            originalTitle: testCase.title,
            originalSteps: testCase.steps,
            success: true,
            result: object
          };
        } catch (error: any) {
          console.error(`Error processing case ${testCase.id}:`, error);
          return {
            caseId: testCase.id,
            originalTitle: testCase.title,
            success: false,
            error: error.message || "Failed to generate impact analysis"
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      allResults.push(...chunkResults);
    }

    return NextResponse.json(allResults);
  } catch (error: any) {
    console.error("Bulk AI Impact Analysis failed:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze impact in bulk" }, { status: 500 });
  }
}
