import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  fail,
  handler,
  ok,
  readJson,
  READ_ROLES,
  requireProject,
  WRITE_ROLES,
} from "@/lib/api-v1";
import { serializeRun } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

const RUN_INCLUDE = {
  author: { select: { id: true, name: true, email: true } },
  _count: { select: { results: true } },
} satisfies Prisma.TestRunInclude;

// GET /api/v1/run/{code}/{id} — includes a status breakdown of its results
export const GET = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const run = await prisma.testRun.findFirst({
    where: { id, projectId: ctx.projectId },
    include: RUN_INCLUDE,
  });
  if (!run) return fail("Run not found.", 404);

  const grouped = await prisma.testRunResult.groupBy({
    by: ["status"],
    where: { runId: run.id },
    _count: { _all: true },
  });
  const stats: Record<string, number> = { total: run._count.results };
  for (const g of grouped) stats[g.status.toLowerCase()] = g._count._all;

  return ok({ ...serializeRun(run), stats });
});

// PATCH /api/v1/run/{code}/{id}
export const PATCH = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await prisma.testRun.findFirst({
    where: { id, projectId: ctx.projectId },
    select: { id: true },
  });
  if (!existing) return fail("Run not found.", 404);

  const body = await readJson<any>(req);
  if (!body) return fail("A JSON body is required.", 422);

  const STATUSES = ["ACTIVE", "COMPLETED", "ABORTED"];
  if (body.status && !STATUSES.includes(String(body.status).toUpperCase())) {
    return fail(`'status' must be one of: ${STATUSES.join(", ")}.`, 422);
  }

  const run = await prisma.testRun.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status ? { status: body.status.toUpperCase() } : {}),
    },
    include: RUN_INCLUDE,
  });

  return ok(serializeRun(run));
});

// DELETE /api/v1/run/{code}/{id}
export const DELETE = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await prisma.testRun.findFirst({
    where: { id, projectId: ctx.projectId },
    select: { id: true },
  });
  if (!existing) return fail("Run not found.", 404);

  await prisma.testRun.delete({ where: { id } });
  return ok({ deleted: true, id });
});
