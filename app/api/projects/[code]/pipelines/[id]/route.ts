import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await params;
  try {
    const body = await req.json();
    const { isActive, cron } = body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const pipeline = await prisma.pipelineSchedule.findUnique({ where: { id } });
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    // 1. Update DB
    const updatedPipeline = await prisma.pipelineSchedule.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : pipeline.isActive,
        cron: cron !== undefined ? cron : pipeline.cron,
      }
    });

    // 2. Update GitHub file if cron or isActive changed
    if (project.githubOwner && project.githubRepo && project.githubToken && (cron !== undefined || isActive !== undefined)) {
      const githubUrl = `https://api.github.com/repos/${project.githubOwner}/${project.githubRepo}/contents/.github/workflows/tessa-cron-${pipeline.id}.yml`;
      
      // Get file SHA first to update/delete it
      const getRes = await fetch(githubUrl, {
        headers: { "Authorization": `token ${project.githubToken}`, "Accept": "application/vnd.github.v3+json" }
      });
      
      let sha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      if (updatedPipeline.isActive) {
        // Create or Update
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const apiUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

        const workflowContent = `name: Scheduled Pipeline - ${updatedPipeline.title.replace(/[^a-zA-Z0-9 ]/g, '')}
on:
  schedule:
    - cron: "${updatedPipeline.cron}"
  workflow_dispatch:

jobs:
  trigger-tessa:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger TESSA
        run: curl -X POST ${apiUrl}/api/projects/${code}/pipelines/${pipeline.id}/trigger
`;

        await fetch(githubUrl, {
          method: "PUT",
          headers: {
            "Authorization": `token ${project.githubToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
          },
          body: JSON.stringify({
            message: `Update TESSA scheduled pipeline: ${updatedPipeline.title}`,
            content: Buffer.from(workflowContent).toString('base64'),
            branch: "main",
            ...(sha ? { sha } : {})
          })
        });
      } else if (sha) {
        // Delete if inactive
        await fetch(githubUrl, {
          method: "DELETE",
          headers: {
            "Authorization": `token ${project.githubToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
          },
          body: JSON.stringify({
            message: `Deactivate TESSA scheduled pipeline: ${updatedPipeline.title}`,
            sha,
            branch: "main"
          })
        });
      }
    }

    return NextResponse.json(updatedPipeline);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const pipeline = await prisma.pipelineSchedule.findUnique({ where: { id } });
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    // 1. Delete DB record
    await prisma.pipelineSchedule.delete({ where: { id } });

    // 2. Delete GitHub file
    if (project.githubOwner && project.githubRepo && project.githubToken) {
      const githubUrl = `https://api.github.com/repos/${project.githubOwner}/${project.githubRepo}/contents/.github/workflows/tessa-cron-${pipeline.id}.yml`;
      const getRes = await fetch(githubUrl, {
        headers: { "Authorization": `token ${project.githubToken}`, "Accept": "application/vnd.github.v3+json" }
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        await fetch(githubUrl, {
          method: "DELETE",
          headers: {
            "Authorization": `token ${project.githubToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
          },
          body: JSON.stringify({
            message: `Delete TESSA scheduled pipeline: ${pipeline.title}`,
            sha: fileData.sha,
            branch: "main"
          })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
