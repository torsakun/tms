import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        githubOwner: true,
        githubRepo: true,
        githubWorkflowId: true,
        githubToken: true // Note: Returning token for simple prototype
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      integrations: {
        githubOwner: project.githubOwner || "",
        githubRepo: project.githubRepo || "",
        githubWorkflowId: project.githubWorkflowId || "",
        githubToken: project.githubToken || ""
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const body = await req.json();
    const { githubOwner, githubRepo, githubWorkflowId, githubToken } = body;

    const project = await prisma.project.update({
      where: { code },
      data: {
        githubOwner: githubOwner || null,
        githubRepo: githubRepo || null,
        githubWorkflowId: githubWorkflowId || null,
        githubToken: githubToken || null,
      }
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
