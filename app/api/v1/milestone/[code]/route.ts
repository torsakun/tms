import { prisma } from "@/lib/prisma";
import {
  fail, handler, listEnvelope, ok, paging, readJson, READ_ROLES, requireProject, WRITE_ROLES,
} from "@/lib/api-v1";
import { serializeMilestone } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/milestone/{code}
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const { limit, offset } = paging(req);
  const where = { projectId: ctx.projectId };
  const [total, rows] = await Promise.all([
    prisma.milestone.count({ where }),
    prisma.milestone.findMany({ where, orderBy: { createdAt: "desc" }, skip: offset, take: limit }),
  ]);
  return ok(listEnvelope(rows.map(serializeMilestone), total, limit, offset));
});

// POST /api/v1/milestone/{code}
export const POST = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const body = await readJson<any>(req);
  if (!body?.title?.trim()) return fail("'title' is required.", 422);
  if (body.due_date && Number.isNaN(Date.parse(body.due_date))) {
    return fail("'due_date' must be an ISO-8601 date.", 422);
  }

  const created = await prisma.milestone.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      status: body.status ? String(body.status).toUpperCase() : "OPEN",
      dueDate: body.due_date ? new Date(body.due_date) : null,
      projectId: ctx.projectId,
    },
  });
  return ok(serializeMilestone(created), 201);
});
