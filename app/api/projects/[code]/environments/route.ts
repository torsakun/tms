import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        environments: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Since we didn't add environments array to Project model in prisma yet 
    // Wait, let's just query Environment directly
    const environments = await prisma.environment.findMany({
      where: { project: { code } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(environments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch environments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await req.json();
    const { title, description, slug } = body;

    const project = await prisma.project.findUnique({ where: { code } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const environment = await prisma.environment.create({
      data: {
        title,
        description,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        projectId: project.id
      }
    });

    return NextResponse.json(environment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create environment" }, { status: 500 });
  }
}
