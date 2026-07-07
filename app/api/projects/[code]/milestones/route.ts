import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/project-route-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const milestones = await prisma.milestone.findMany({
      where: { project: { code } },
      orderBy: { createdAt: "desc" },
      include: {
        testRuns: {
          include: {
            results: { select: { status: true } },
          },
        },
      },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 },
    );
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
    const { title, description, dueDate } = body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: project.id,
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 },
    );
  }
}
