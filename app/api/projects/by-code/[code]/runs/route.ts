import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        testRuns: {
          orderBy: { createdAt: 'desc' },
          include: {
            results: true
          }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(project.testRuns);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await req.json();
    
    // Find project
    const project = await prisma.project.findUnique({
      where: { code },
      include: { testCases: true } // grab all cases to auto-add to run for MVP
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.testCases.length === 0) {
      return NextResponse.json({ error: "Cannot start a run without test cases" }, { status: 400 });
    }

    // Create Test Run
    const run = await prisma.testRun.create({
      data: {
        title: body.title || `Test Run ${new Date().toISOString().split('T')[0]}`,
        description: body.description || "",
        projectId: project.id,
        // Auto create results for all cases in project
        results: {
          create: project.testCases.map(tc => ({
            caseId: tc.id,
            status: "IN_PROGRESS"
          }))
        }
      },
      include: {
        results: true
      }
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create test run" }, { status: 500 });
  }
}
