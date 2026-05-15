import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const testCaseSchema = z.object({
  testCases: z.array(
    z.object({
      title: z.string().describe("A concise, clear title for the test case"),
      description: z.string().describe("Detailed description of what is being tested. Use empty string if none."),
      preconditions: z.string().describe("State or conditions required before execution. Use empty string if none."),
      severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL"]).describe("Severity level of the test"),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]).describe("Priority level of the test"),
      steps: z.array(
        z.object({
          action: z.string().describe("Action to perform"),
          expectedResult: z.string().describe("Expected outcome of the action. Use empty string if none.")
        })
      ).describe("Step-by-step instructions to execute the test")
    })
  )
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requirementText, modelProvider, imageBase64 } = body;

    if (!requirementText) {
      return NextResponse.json({ error: "requirementText is required" }, { status: 400 });
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

    const { object } = await generateObject({
      model: aiModel,
      schema: testCaseSchema,
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `You are an expert QA Engineer. Your task is to analyze the following requirement/user story or UI mockup and generate a comprehensive set of test cases.
Include both positive and negative scenarios.
Ensure each test case has clear step-by-step actions and expected results.
IMPORTANT: Generate the test cases entirely in Thai language (ภาษาไทย).

Requirement:
${requirementText}` 
            },
            ...(imageBase64 ? [{ type: 'image', image: imageBase64 }] : [])
          ] as any // Use 'any' cast to avoid complex type checking issues across different model SDK versions
        }
      ]
    });

    return NextResponse.json(object.testCases);
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate test cases" }, { status: 500 });
  }
}
