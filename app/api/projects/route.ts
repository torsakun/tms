import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and Code are required" }, { status: 400 });
    }

    // Ensure code is uppercase and valid
    const formattedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Check if project with code already exists
    const existing = await prisma.project.findUnique({ where: { code: formattedCode } });
    if (existing) {
      return NextResponse.json({ error: "Project code already exists" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        code: formattedCode,
        description
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true
      }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
