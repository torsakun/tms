import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { extractMentionedUserIds } from "@/lib/mentions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { caseId } = await params;
  const comments = await prisma.comment.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> },
) {
  const { code, caseId } = await params;
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

    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      select: { id: true, title: true },
    });
    if (!testCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { body: body.trim(), caseId, authorId: actorId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    // Resolve @mentions and notify (skip self)
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
          entityId: caseId,
          link: `/projects/${code}/cases/${caseId}/edit`,
          title: "Mentioned in a comment",
          message: `${session.user?.name || "Someone"} mentioned you on case: ${testCase.title}`,
        })),
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to comment" }, { status: 500 });
  }
}
