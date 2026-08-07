import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
import { serializeResult } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";
import { applyResult, RESULT_STATUSES, ResultPayload } from "./apply";

const RESULT_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  attachments: { select: { id: true, originalName: true, url: true, mimeType: true, size: true } },
} satisfies Prisma.TestRunResultInclude;

// GET /api/v1/result/{code}/{runId} — results of one run. Filter: ?status=FAILED
export const GET = handler(async (req, { params }) => {
  const { code, runId } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const run = await prisma.testRun.findFirst({
    where: { id: runId, projectId: ctx.projectId },
    select: { id: true },
  });
  if (!run) return fail("Run not found.", 404);

  const { limit, offset } = paging(req);
  const status = new URL(req.url).searchParams.get("status");

  const where: Prisma.TestRunResultWhereInput = { runId: run.id };
  if (status) where.status = status.toUpperCase() as any;

  const [total, results] = await Promise.all([
    prisma.testRunResult.count({ where }),
    prisma.testRunResult.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
      include: RESULT_INCLUDE,
    }),
  ]);

  return ok(listEnvelope(results.map(serializeResult), total, limit, offset));
});

// POST /api/v1/result/{code}/{runId} — record one case's outcome
export const POST = handler(async (req, { params }) => {
  const { code, runId } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const run = await prisma.testRun.findFirst({
    where: { id: runId, projectId: ctx.projectId },
    select: { id: true, status: true },
  });
  if (!run) return fail("Run not found.", 404);
  if (run.status !== "ACTIVE") {
    return fail("This run is not active — reopen it before submitting results.", 409);
  }

  const body = await readJson<ResultPayload>(req);
  if (!body) return fail("A JSON body is required.", 422);
  if (!body.case_id && !body.case) return fail("'case_id' (or 'case') is required.", 422);
  if (!body.status || !RESULT_STATUSES.includes(String(body.status).toUpperCase())) {
    return fail(`'status' must be one of: ${RESULT_STATUSES.join(", ")}.`, 422);
  }

  const outcome = await applyResult(ctx.projectId, run.id, body, ctx.actor.userId);
  if ("error" in outcome) return fail(outcome.error, outcome.status);

  const saved = await prisma.testRunResult.findUnique({
    where: { id: outcome.resultId },
    include: RESULT_INCLUDE,
  });

  return ok(serializeResult(saved), 201);
});
