import { prisma } from "@/lib/prisma";
import { handler, ok, READ_ROLES, requireProject } from "@/lib/api-v1";
import { serializeProject } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/projects/{code}
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const project = await prisma.project.findUnique({
    where: { id: ctx.projectId },
    include: { _count: { select: { testCases: true, suites: true, testRuns: true } } },
  });

  return ok(serializeProject(project));
});
