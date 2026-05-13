import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string, runId: string }> }
) {
  const { code, runId } = await params;
  
  try {
    const testRun = await prisma.testRun.findUnique({
      where: { id: runId },
      include: { 
        project: true,
        results: {
          include: { testCase: true }
        }
      }
    });

    if (!testRun) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 });
    }

    const GITHUB_TOKEN = testRun.project.githubToken || process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = testRun.project.githubOwner || process.env.GITHUB_OWNER;
    const GITHUB_REPO = testRun.project.githubRepo || process.env.GITHUB_REPO;
    const GITHUB_WORKFLOW_ID = testRun.project.githubWorkflowId || process.env.GITHUB_WORKFLOW_ID || "playwright.yml";

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return NextResponse.json({ 
        error: "GitHub integration is not configured. Please set it in Project Settings -> Integrations." 
      }, { status: 400 });
    }

    const headers = {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };

    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    const dispatchUrl = `${baseUrl}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`;

    // Gather short IDs to pass to Playwright
    const automatedShortIds = testRun.results
      .filter((r: any) => r.testCase.automationStatus === 'AUTOMATED')
      .map((r: any) => `${code}-${r.testCase.id.substring(0, 4)}`)
      .join(" ");

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Assuming the workflow takes `run_id`, `case_ids`, and `api_url` as inputs
    const dispatchRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: "main",
        inputs: {
          run_id: runId,
          case_ids: automatedShortIds,
          api_url: apiUrl
        }
      })
    });

    if (!dispatchRes.ok) {
      const err = await dispatchRes.json();
      throw new Error(`Failed to trigger GitHub Actions: ${err.message}`);
    }

    // Reset Run status to ACTIVE
    await prisma.testRun.update({
      where: { id: runId },
      data: { status: 'ACTIVE' }
    });

    // Reset automated test results to IN_PROGRESS
    const automatedResultIds = testRun.results
      .filter((r: any) => r.testCase.automationStatus === 'AUTOMATED')
      .map((r: any) => r.id);

    if (automatedResultIds.length > 0) {
      await prisma.testRunResult.updateMany({
        where: { id: { in: automatedResultIds } },
        data: { 
          status: 'IN_PROGRESS',
          comment: null // Clear previous logs
        }
      });
    }

    return NextResponse.json({ success: true, message: "GitHub Actions workflow triggered successfully" });

  } catch (error: any) {
    console.error("GitHub Dispatch error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
