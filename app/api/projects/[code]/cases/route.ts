// (Phase 2) Backend API Routes
// # จัดการ Project และ Cases ภายใต้ Project
// app/api/projects/[code]/cases/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import { z } from "zod";

const testCaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  postconditions: z.string().optional(),
  severity: z.enum(["NOT_SET", "BLOCKER", "CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL"]),
  priority: z.enum(["NOT_SET", "HIGH", "MEDIUM", "LOW"]),
  automationStatus: z.enum(["MANUAL", "TO_BE_AUTOMATED", "AUTOMATED"]),
  suiteId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  attachmentIds: z.array(z.string()).optional(),
  steps: z.array(z.object({
    action: z.string(),
    expectedResult: z.string().optional(),
    position: z.number()
  })).optional(),
  customFields: z.record(z.string(), z.any()).optional()
});

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
      return NextResponse.json({ error: "Forbidden: You do not have permission to create test cases in this project" }, { status: 403 });
    }

    const projectId = project.id;
    const body = await req.json();
    const validatedData = testCaseSchema.parse(body);
    const { tags, attachmentIds, steps, customFields, ...rest } = validatedData;

    const testCase = await prisma.testCase.create({
      data: {
        ...rest,
        projectId: projectId,
        tags: tags && tags.length > 0 ? {
          connectOrCreate: tags.map(tagName => ({
            where: { name_projectId: { name: tagName, projectId: projectId } },
            create: { name: tagName, projectId: projectId }
          }))
        } : undefined,
        attachments: attachmentIds && attachmentIds.length > 0 ? {
          connect: attachmentIds.map(id => ({ id }))
        } : undefined,
        customFields: customFields || undefined,
        steps: {
          create: steps || []
        }
      },
      include: { steps: true, tags: true, attachments: true }
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid request data or internal error" }, { status: 400 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: projectIdOrCode } = await params;
  
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

  const url = new URL(req.url);
  const automationStatus = url.searchParams.get("automationStatus");

  const whereClause: any = { projectId: project.id };
  if (automationStatus) {
    whereClause.automationStatus = automationStatus;
  }

  const cases = await prisma.testCase.findMany({
    where: whereClause,
    include: { steps: true, tags: true, attachments: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(cases);
}