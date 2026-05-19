import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function POST(req: Request, { params }: { params: Promise<{ code: string, suiteId: string }> }) {
  const { code: projectIdOrCode, suiteId } = await params;
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectIdOrCode },
          { code: projectIdOrCode }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(project.code, (session.user as any).id, ['EDITOR', 'ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: You do not have permission to clone suites in this project" }, { status: 403 });
    }

    // Recursive function to clone suite, its cases, and its children
    async function cloneSuite(sourceSuiteId: string, newParentId: string | null, isTopLevel: boolean = false) {
      const sourceSuite = await prisma.testSuite.findUnique({
        where: { id: sourceSuiteId },
        include: {
          testCases: { include: { steps: true, tags: true } },
          children: true
        }
      });

      if (!sourceSuite) throw new Error(`Suite ${sourceSuiteId} not found`);

      // Create new suite
      const newSuite = await prisma.testSuite.create({
        data: {
          title: isTopLevel ? `${sourceSuite.title} - Clone` : sourceSuite.title,
          description: sourceSuite.description,
          position: sourceSuite.position,
          projectId: project!.id,
          parentId: newParentId,
        }
      });

      // Clone Test Cases
      for (const tc of sourceSuite.testCases) {
        await prisma.testCase.create({
          data: {
            title: tc.title,
            description: tc.description,
            preconditions: tc.preconditions,
            postconditions: tc.postconditions,
            priority: tc.priority,
            severity: tc.severity,
            automationStatus: tc.automationStatus,
            projectId: project!.id,
            suiteId: newSuite.id,
            authorId: (session!.user as any).id,
            steps: {
              create: tc.steps.map(step => ({
                action: step.action,
                expectedResult: step.expectedResult,
                position: step.position,
                sharedStepId: step.sharedStepId
              }))
            },
            tags: {
              connect: tc.tags.map(tag => ({ id: tag.id }))
            }
          }
        });
      }

      // Recursively clone children
      for (const child of sourceSuite.children) {
        await cloneSuite(child.id, newSuite.id, false);
      }
      
      return newSuite;
    }

    const newSuite = await cloneSuite(suiteId, null, true);

    return NextResponse.json(newSuite, { status: 201 });
  } catch (error) {
    console.error("Failed to clone suite", error);
    return NextResponse.json({ error: "Failed to clone suite" }, { status: 400 });
  }
}
