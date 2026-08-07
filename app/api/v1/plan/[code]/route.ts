import { prisma } from "@/lib/prisma";
import {
  fail, handler, listEnvelope, ok, paging, readJson, READ_ROLES, requireProject, WRITE_ROLES,
} from "@/lib/api-v1";
import { serializePlan } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/plan/{code}
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const { limit, offset } = paging(req);
  const where = { projectId: ctx.projectId };
  const [total, rows] = await Promise.all([
    prisma.testPlan.count({ where }),
    prisma.testPlan.findMany({
      where, orderBy: { createdAt: "desc" }, skip: offset, take: limit,
      include: { _count: { select: { testCases: true } } },
    }),
  ]);
  return ok(listEnvelope(rows.map(serializePlan), total, limit, offset));
});

// POST /api/v1/plan/{code} — `cases` accepts uuids or sequence numbers
export const POST = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const body = await readJson<any>(req);
  if (!body?.title?.trim()) return fail("'title' is required.", 422);

  let caseIds: string[] = [];
  if (Array.isArray(body.cases) && body.cases.length) {
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
    caseIds = found.map((c) => c.id);
    if (!caseIds.length) return fail("None of the given 'cases' exist in this project.", 422);
  }

  const created = await prisma.testPlan.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      projectId: ctx.projectId,
      ...(caseIds.length ? { testCases: { connect: caseIds.map((id) => ({ id })) } } : {}),
    },
    include: { _count: { select: { testCases: true } } },
  });
  return ok(serializePlan(created), 201);
});
