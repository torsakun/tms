import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pipelines);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = await req.json();
    const { title, description, cron } = body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // 1. Create pipeline in DB
    const pipeline = await prisma.pipelineSchedule.create({
      data: {
        title,
        description,
        cron,
        projectId: project.id,
      },
    });

    // 2. Create GitHub Actions workflow file
    if (project.githubOwner && project.githubRepo && project.githubToken) {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
