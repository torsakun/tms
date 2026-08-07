import { prisma } from "@/lib/prisma";
import {
  fail,
  handler,
  ok,
  readJson,
  READ_ROLES,
  requireProject,
  WRITE_ROLES,
} from "@/lib/api-v1";
import { serializeSuite } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

const withCount = { _count: { select: { testCases: true } } };

// GET /api/v1/suite/{code}/{id}
export const GET = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const suite = await prisma.testSuite.findFirst({
    where: { id, projectId: ctx.projectId },
    include: withCount,
  });
  if (!suite) return fail("Suite not found.", 404);

  return ok(serializeSuite(suite));
});

// PATCH /api/v1/suite/{code}/{id}
export const PATCH = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await prisma.testSuite.findFirst({
    where: { id, projectId: ctx.projectId },
    select: { id: true },
  });
  if (!existing) return fail("Suite not found.", 404);

  const body = await readJson<{ title?: string; description?: string; parent_id?: string | null }>(req);
  if (!body) return fail("A JSON body is required.", 422);

  if (body.parent_id) {
    if (body.parent_id === id) return fail("A suite cannot be its own parent.", 422);
    const parent = await prisma.testSuite.findFirst({
      where: { id: body.parent_id, projectId: ctx.projectId },
      select: { id: true },
    });
    if (!parent) return fail("'parent_id' does not name a suite in this project.", 422);
  }

  const suite = await prisma.testSuite.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.parent_id !== undefined ? { parentId: body.parent_id } : {}),
    },
    include: withCount,
  });

  return ok(serializeSuite(suite));
});

// DELETE /api/v1/suite/{code}/{id}
// ?retain_cases=true moves the cases up to the parent instead of deleting them.
export const DELETE = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const suite = await prisma.testSuite.findFirst({
    where: { id, projectId: ctx.projectId },
    select: { id: true, parentId: true },
  });
  if (!suite) return fail("Suite not found.", 404);

  const retain = new URL(req.url).searchParams.get("retain_cases") === "true";

  // Child suites cascade on delete, so their cases have to be handled here too.
  const descendants = async (parentId: string): Promise<string[]> => {
    const kids = await prisma.testSuite.findMany({ where: { parentId }, select: { id: true } });
    let ids = kids.map((k) => k.id);
    for (const k of kids) ids = ids.concat(await descendants(k.id));
    return ids;
  };
  const all = [id, ...(await descendants(id))];

  if (retain) {
    await prisma.testCase.updateMany({
      where: { suiteId: { in: all } },
      data: { suiteId: suite.parentId },
    });
  } else {
    await prisma.testCase.deleteMany({ where: { suiteId: { in: all } } });
  }

  await prisma.testSuite.delete({ where: { id } });
  return ok({ deleted: true, id });
});
