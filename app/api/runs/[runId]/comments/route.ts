import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { extractMentionedUserIds } from "@/lib/mentions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const comments = await prisma.comment.findMany({
    where: { runId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const actorId = (session.user as any).id;

    const { body } = await req.json();
    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Empty comment" }, { status: 400 });
    }

    const run = await prisma.testRun.findUnique({
      where: { id: runId },
      select: { id: true, title: true, project: { select: { code: true } } },
    });
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { body: body.trim(), runId, authorId: actorId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    });
    const mentioned = extractMentionedUserIds(body, users).filter(
      (id) => id !== actorId,
    );
    if (mentioned.length > 0) {
      await prisma.notification.createMany({
        data: mentioned.map((recipientId) => ({
          recipientId,
          actorId,
          type: "MENTION" as const,
          entityId: runId,
          link: `/projects/${run.project.code}/runs/${runId}`,
          title: "Mentioned in a comment",
          message: `${session.user?.name || "Someone"} mentioned you on run: ${run.title}`,
        })),
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create run comment error:", error);
    return NextResponse.json({ error: "Failed to comment" }, { status: 500 });
  }
}
