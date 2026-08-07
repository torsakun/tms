import { prisma } from "@/lib/prisma";
import {
  fail,
  handler,
  listEnvelope,
  ok,
  paging,
  readJson,
  READ_ROLES,
  requireProject,
  WRITE_ROLES,
} from "@/lib/api-v1";
import { serializeSuite } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/suite/{code} — list suites
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const { limit, offset } = paging(req);
  const where = { projectId: ctx.projectId };

  const [total, suites] = await Promise.all([
    prisma.testSuite.count({ where }),
    prisma.testSuite.findMany({
      where,
      orderBy: { position: "asc" },
      skip: offset,
      take: limit,
      include: { _count: { select: { testCases: true } } },
    }),
  ]);

  return ok(listEnvelope(suites.map(serializeSuite), total, limit, offset));
});

// POST /api/v1/suite/{code} — create a suite
export const POST = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const body = await readJson<{ title?: string; description?: string; parent_id?: string }>(req);
  if (!body?.title?.trim()) return fail("'title' is required.", 422);

  if (body.parent_id) {
    const parent = await prisma.testSuite.findFirst({
      where: { id: body.parent_id, projectId: ctx.projectId },
      select: { id: true },
    });
    if (!parent) return fail("'parent_id' does not name a suite in this project.", 422);
  }

  const suite = await prisma.testSuite.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      parentId: body.parent_id ?? null,
      projectId: ctx.projectId,
    },
    include: { _count: { select: { testCases: true } } },
  });

  return ok(serializeSuite(suite), 201);
});
