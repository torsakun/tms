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
import { serializeCase } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

const CASE_INCLUDE = {
  steps: { orderBy: { position: "asc" } },
  tags: true,
  project: { select: { code: true } },
  author: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TestCaseInclude;

/** Accepts either the uuid or the human code's number, e.g. 42 from "PRO-42". */
async function findCase(projectId: string, idOrSeq: string) {
  const seq = Number(idOrSeq);
  if (Number.isInteger(seq) && seq > 0) {
    return prisma.testCase.findFirst({
      where: { projectId, sequenceNumber: seq },
      include: CASE_INCLUDE,
    });
  }
  return prisma.testCase.findFirst({ where: { id: idOrSeq, projectId }, include: CASE_INCLUDE });
}

// GET /api/v1/case/{code}/{id}
export const GET = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const testCase = await findCase(ctx.projectId, id);
  if (!testCase) return fail("Case not found.", 404);

  return ok(serializeCase(testCase));
});

// PATCH /api/v1/case/{code}/{id}
// Passing `steps` replaces the whole list — partial step edits aren't supported.
export const PATCH = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await findCase(ctx.projectId, id);
  if (!existing) return fail("Case not found.", 404);

  const body = await readJson<any>(req);
  if (!body) return fail("A JSON body is required.", 422);

  if (body.suite_id) {
    const suite = await prisma.testSuite.findFirst({
      where: { id: body.suite_id, projectId: ctx.projectId },
      select: { id: true },
    });
    if (!suite) return fail("'suite_id' does not name a suite in this project.", 422);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Array.isArray(body.steps)) {
      await tx.testStep.deleteMany({ where: { caseId: existing.id } });
      if (body.steps.length) {
        await tx.testStep.createMany({
          data: body.steps.map((s: any, i: number) => ({
            caseId: existing.id,
            action: String(s.action ?? ""),
            expectedResult: s.expected_result ?? null,
            position: i,
          })),
        });
      }
    }

    return tx.testCase.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.preconditions !== undefined ? { preconditions: body.preconditions } : {}),
        ...(body.postconditions !== undefined ? { postconditions: body.postconditions } : {}),
        ...(body.priority ? { priority: body.priority.toUpperCase() } : {}),
        ...(body.severity ? { severity: body.severity.toUpperCase() } : {}),
        ...(body.automation ? { automationStatus: body.automation.toUpperCase() } : {}),
        ...(body.suite_id !== undefined ? { suiteId: body.suite_id } : {}),
      },
      include: CASE_INCLUDE,
    });
  });

  return ok(serializeCase(updated));
});

// DELETE /api/v1/case/{code}/{id}
export const DELETE = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const existing = await findCase(ctx.projectId, id);
  if (!existing) return fail("Case not found.", 404);

  await prisma.testCase.delete({ where: { id: existing.id } });
  return ok({ deleted: true, id: existing.id });
});
