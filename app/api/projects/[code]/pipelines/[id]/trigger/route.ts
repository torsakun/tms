import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  const { code, id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const pipeline = await prisma.pipelineSchedule.findUnique({
      where: { id },
    });
    if (!pipeline)
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 },
      );

    if (!pipeline.isActive) {
      return NextResponse.json(
        { error: "Pipeline is inactive" },
        { status: 400 },
      );
    }

    const GITHUB_TOKEN = project.githubToken || process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = project.githubOwner || process.env.GITHUB_OWNER;
    const GITHUB_REPO = project.githubRepo || process.env.GITHUB_REPO;
    const GITHUB_WORKFLOW_ID =
      project.githubWorkflowId ||
      process.env.GITHUB_WORKFLOW_ID ||
      "playwright.yml";

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return NextResponse.json(
        { error: "GitHub integration is not configured" },
        { status: 400 },
      );
    }

    // Find automated test cases
    const testCases = await prisma.testCase.findMany({
      where: {
        projectId: project.id,
        automationStatus: "AUTOMATED",
      },
    });

    if (testCases.length === 0) {
      return NextResponse.json(
        { error: "No automated test cases found" },
        { status: 400 },
      );
    }

    // Create Test Run
    const run = await prisma.testRun.create({
      data: {
        title: `Scheduled Run: ${pipeline.title}`,
        description: `Triggered automatically by TESSA Pipeline Orchestration at ${new Date().toISOString()}`,
        projectId: project.id,
        status: "ACTIVE",
        results: {
          create: testCases.map((tc) => ({
            caseId: tc.id,
            status: "IN_PROGRESS",
          })),
        },
      },
    });

    // Trigger GitHub Action
    const dispatchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`;

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Extract short IDs for the workflow
    const automatedShortIds = testCases
      .map((tc) => {
        const shortId = tc.id.substring(0, 4);
        return `${project.code}-${shortId}`;
      })
      .join(" ");

    const ghRes = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          run_id: run.id,
          case_ids: automatedShortIds,
          api_url: apiUrl,
        },
      }),
    });

    if (!ghRes.ok) {
      console.error(
        "Failed to trigger GitHub Action from Pipeline",
        await ghRes.text(),
      );
      return NextResponse.json(
        { error: "Created run but failed to trigger GitHub Action" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, runId: run.id });
  } catch (err: any) {
    console.error("Pipeline Trigger Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
