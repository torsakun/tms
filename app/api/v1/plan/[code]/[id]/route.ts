import { prisma } from "@/lib/prisma";
import { fail, handler, ok, readJson, READ_ROLES, requireProject, WRITE_ROLES } from "@/lib/api-v1";
import { serializePlan } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

export const GET = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  const row = await prisma.testPlan.findFirst({
    where: { id, projectId: ctx.projectId },
    include: { _count: { select: { testCases: true } }, testCases: { select: { id: true } } },
  });
  if (!row) return fail("Plan not found.", 404);
  return ok(serializePlan(row));
});

// PATCH — passing `cases` replaces the plan's case list outright
export const PATCH = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  const existing = await prisma.testPlan.findFirst({
    where: { id, projectId: ctx.projectId }, select: { id: true },
  });
  if (!existing) return fail("Plan not found.", 404);

  const body = await readJson<any>(req);
  if (!body) return fail("A JSON body is required.", 422);

  let setCases: { id: string }[] | undefined;
  if (Array.isArray(body.cases)) {
    const uuids = body.cases.filter((c: any) => typeof c === "string");
    const seqs = body.cases.map((c: any) => Number(c)).filter((n: number) => Number.isInteger(n) && n > 0);
    const found = await prisma.testCase.findMany({
      where: {
        projectId: ctx.projectId,
        OR: [
          ...(uuids.length ? [{ id: { in: uuids } }] : []),
          ...(seqs.length ? [{ sequenceNumber: { in: seqs } }] : []),
        ],
      },
      select: { id: true },
    });
    setCases = found.map((c) => ({ id: c.id }));
  }

  const row = await prisma.testPlan.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(setCases ? { testCases: { set: setCases } } : {}),
    },
    include: { _count: { select: { testCases: true } }, testCases: { select: { id: true } } },
  });
  return ok(serializePlan(row));
});

export const DELETE = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  const existing = await prisma.testPlan.findFirst({
    where: { id, projectId: ctx.projectId }, select: { id: true },
  });
  if (!existing) return fail("Plan not found.", 404);
  await prisma.testPlan.delete({ where: { id } });
  return ok({ deleted: true, id });
});
