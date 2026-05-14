import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  try {
    const { releaseNotes } = await req.json();
    if (!releaseNotes) {
      return NextResponse.json({ error: "Release notes are required" }, { status: 400 });
    }

    // Fetch all test cases for the project to feed into the AI context
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        testCases: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Prepare context for AI
    const casesContext = project.testCases.map(tc => `ID: ${tc.id}\nTitle: ${tc.title}\nDescription: ${tc.description || 'None'}`).join("\n\n");

    const prompt = `
You are an expert QA Engineer. I will provide you with Release Notes/Changelog for an upcoming release, and a list of all existing Test Cases in our repository.
Your task is to select the most relevant Test Cases that should be executed to validate this release.
You must select both feature-specific tests and relevant regression tests that might be impacted.

### Release Notes:
${releaseNotes}

### Available Test Cases:
${casesContext}

Respond ONLY with a valid JSON array of strings containing the exact IDs of the test cases you selected. Do not include any other text, markdown formatting, or explanations.
Example format:
["case-uuid-1", "case-uuid-2"]
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown blocks
    let jsonStr = responseText;
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '').trim();

    try {
      const selectedIds = JSON.parse(jsonStr);
      if (!Array.isArray(selectedIds)) {
        throw new Error("AI did not return an array");
      }
      return NextResponse.json({ selectedIds });
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({ error: "AI response parsing failed." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Smart Plan API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
