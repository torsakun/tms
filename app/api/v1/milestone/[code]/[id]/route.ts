import { prisma } from "@/lib/prisma";
import { fail, handler, ok, readJson, READ_ROLES, requireProject, WRITE_ROLES } from "@/lib/api-v1";
import { serializeMilestone } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

async function find(projectId: string, id: string) {
  return prisma.milestone.findFirst({ where: { id, projectId } });
}

export const GET = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  const row = await find(ctx.projectId, id);
  if (!row) return fail("Milestone not found.", 404);
  return ok(serializeMilestone(row));
});

export const PATCH = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  if (!(await find(ctx.projectId, id))) return fail("Milestone not found.", 404);

  const body = await readJson<any>(req);
  if (!body) return fail("A JSON body is required.", 422);
  if (body.due_date && Number.isNaN(Date.parse(body.due_date))) {
    return fail("'due_date' must be an ISO-8601 date.", 422);
  }

  const row = await prisma.milestone.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status ? { status: String(body.status).toUpperCase() } : {}),
      ...(body.due_date !== undefined
        ? { dueDate: body.due_date ? new Date(body.due_date) : null }
        : {}),
    },
  });
  return ok(serializeMilestone(row));
});

export const DELETE = handler(async (req, { params }) => {
  const { code, id } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;
  if (!(await find(ctx.projectId, id))) return fail("Milestone not found.", 404);
  await prisma.milestone.delete({ where: { id } });
  return ok({ deleted: true, id });
});
