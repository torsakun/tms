import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: projectIdOrCode } = await params;
  try {
    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectIdOrCode },
          { code: projectIdOrCode }
        ]
      }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          code: projectIdOrCode,
          name: projectIdOrCode + " Project"
        }
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(project.code, (session.user as any).id, ['EDITOR', 'ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: You do not have permission to create suites in this project" }, { status: 403 });
    }

    const body = await req.json();
    const { title, parentId, description } = body;

    const suite = await prisma.testSuite.create({
      data: {
        title,
        description,
        parentId,
        projectId: project.id
      }
    });

    return NextResponse.json(suite, { status: 201 });
  } catch (error) {
    console.error("Failed to create suite", error);
    return NextResponse.json({ error: "Failed to create suite" }, { status: 400 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: projectIdOrCode } = await params;
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { id: projectIdOrCode },
        { code: projectIdOrCode }
      ]
    }
  });

  if (!project) return NextResponse.json([], { status: 200 });

  const suites = await prisma.testSuite.findMany({
    where: { projectId: project.id },
    orderBy: { position: 'asc' }
  });

  return NextResponse.json(suites);
}
