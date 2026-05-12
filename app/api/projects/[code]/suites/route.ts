import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
