import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Only process issue updates
    if (payload.webhookEvent === "jira:issue_updated" && payload.issue) {
      const jiraId = payload.issue.key;
      // Depending on Jira configuration, the description might be a string or Atlassian Document Format (ADF)
      // We will assume string for simplicity, or grab summary if description is missing.
      const newRequirementText =
        payload.issue.fields?.description ||
        payload.issue.fields?.summary ||
        "";

      if (!newRequirementText) {
        return NextResponse.json({
          message: "No requirement text found in Jira payload",
        });
      }

      // Find all test cases linked to this Jira issue
      const testCases = await prisma.testCase.findMany({
        where: { jiraId: jiraId },
      });

      let updatedCount = 0;

      for (const tc of testCases) {
        // Compare with baseline requirementText
        if (tc.requirementText !== newRequirementText) {
          await prisma.testCase.update({
            where: { id: tc.id },
            data: { isOutdated: true },
          });
          updatedCount++;
        }
      }

      return NextResponse.json({
        message: "Webhook processed successfully",
        affectedCases: updatedCount,
      });
    }

    return NextResponse.json({ message: "Ignored event type" });
  } catch (error: any) {
    console.error("Jira Webhook Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
