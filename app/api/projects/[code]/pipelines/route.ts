import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const pipelines = await prisma.pipelineSchedule.findMany({
      where: { projectId: project.id },
      include: {
        plan: {
          select: {
            id: true,
            title: true,
            _count: { select: { testCases: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const scheduledRuns = await prisma.testRun.findMany({
      where: {
        projectId: project.id,
        title: { startsWith: "Scheduled Run: " },
      },
      include: {
        results: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pipelinesWithLastRun = pipelines.map((pipeline) => {
      const lastRun = scheduledRuns.find(
        (run) => run.title === `Scheduled Run: ${pipeline.title}`,
      );
      const totalResults = lastRun?.results.length ?? 0;
      const passedResults =
        lastRun?.results.filter((result) => result.status === "PASSED")
          .length ?? 0;

      return {
        ...pipeline,
        lastRun: lastRun
          ? {
              id: lastRun.id,
              status: lastRun.status,
              createdAt: lastRun.createdAt,
              updatedAt: lastRun.updatedAt,
              passRate:
                totalResults > 0
                  ? Math.round((passedResults / totalResults) * 100)
                  : null,
            }
          : null,
      };
    });

    return NextResponse.json(pipelinesWithLastRun);
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const access = await requireProjectAccess(code);
    if (access instanceof NextResponse) return access;

    const body = await req.json();
    const { title, description, cron, activateImmediately, isActive, planId } =
      body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!cron?.trim()) {
      return NextResponse.json({ error: "Cron is required" }, { status: 400 });
    }

    let selectedPlanId: string | undefined;
    if (planId) {
      const plan = await prisma.testPlan.findFirst({
        where: { id: planId, projectId: project.id },
        select: { id: true },
      });
      if (!plan) {
        return NextResponse.json(
          { error: "Test plan not found" },
          { status: 400 },
        );
      }
      selectedPlanId = plan.id;
    }

    // 1. Create pipeline in DB
    const pipeline = await prisma.pipelineSchedule.create({
      data: {
        title: title.trim(),
        description,
        cron: cron.trim(),
        isActive: activateImmediately ?? isActive ?? true,
        projectId: project.id,
        planId: selectedPlanId,
      },
      include: {
        plan: {
          select: {
            id: true,
            title: true,
            _count: { select: { testCases: true } },
          },
        },
      },
    });

    // 2. Create GitHub Actions workflow file
    if (
      pipeline.isActive &&
      project.githubOwner &&
      project.githubRepo &&
      project.githubToken
    ) {
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const host = req.headers.get("host");
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

      const workflowContent = `name: Scheduled Pipeline - ${title.replace(/[^a-zA-Z0-9 ]/g, "")}
on:
  schedule:
    - cron: "${cron}"
  workflow_dispatch:

jobs:
  trigger-tessa:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger TESSA
        run: curl -X POST ${apiUrl}/api/projects/${code}/pipelines/${pipeline.id}/trigger
`;

      const githubUrl = `https://api.github.com/repos/${project.githubOwner}/${project.githubRepo}/contents/.github/workflows/tessa-cron-${pipeline.id}.yml`;
      const encodedContent = Buffer.from(workflowContent).toString("base64");

      const ghRes = await fetch(githubUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${project.githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message: `Add TESSA scheduled pipeline: ${title}`,
          content: encodedContent,
          branch: "main",
        }),
      });

      if (!ghRes.ok) {
        console.error("Failed to create GitHub workflow", await ghRes.text());
        // We won't fail the creation but log the error
      }
    }

    return NextResponse.json(pipeline, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
