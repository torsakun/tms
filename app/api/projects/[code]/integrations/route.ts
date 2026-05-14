import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(code, (session.user as any).id, ['ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        githubOwner: true,
        githubRepo: true,
        githubWorkflowId: true,
        githubToken: true, // Note: Returning token for simple prototype
        msTeamsWebhookUrl: true
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
        githubToken: project.githubToken || "",
        msTeamsWebhookUrl: project.msTeamsWebhookUrl || ""
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(code, (session.user as any).id, ['ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { githubOwner, githubRepo, githubWorkflowId, githubToken, msTeamsWebhookUrl } = body;

    const project = await prisma.project.update({
      where: { code },
      data: {
        githubOwner: githubOwner || null,
        githubRepo: githubRepo || null,
        githubWorkflowId: githubWorkflowId || null,
        githubToken: githubToken || null,
        msTeamsWebhookUrl: msTeamsWebhookUrl || null,
      }
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
