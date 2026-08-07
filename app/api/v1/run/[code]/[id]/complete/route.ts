import { prisma } from "@/lib/prisma";
import { fail, handler, ok, requireProject, WRITE_ROLES } from "@/lib/api-v1";
import { serializeRun } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// POST /api/v1/run/{code}/{id}/complete — close a run, the usual last step in CI
export const POST = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await prisma.testRun.findFirst({
    where: { id, projectId: ctx.projectId },
    select: { id: true, status: true },
  });
  if (!existing) return fail("Run not found.", 404);
  if (existing.status === "COMPLETED") return fail("This run is already completed.", 409);

  const run = await prisma.testRun.update({
    where: { id },
    data: { status: "COMPLETED" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { results: true } },
    },
  });

  return ok(serializeRun(run));
});
