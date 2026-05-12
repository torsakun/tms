import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const sharedSteps = await prisma.sharedStep.findMany({
      where: { project: { code } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sharedSteps);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch shared steps" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await req.json();
    const { title, action, expectedResult } = body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const sharedStep = await prisma.sharedStep.create({
      data: {
        title,
        action,
        expectedResult,
        projectId: project.id
      }
    });

    return NextResponse.json(sharedStep, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create shared step" }, { status: 500 });
  }
}
