import { prisma } from "@/lib/prisma";
import {
  fail, handler, listEnvelope, ok, paging, readJson, READ_ROLES, requireProject, WRITE_ROLES,
} from "@/lib/api-v1";
import { serializeEnvironment } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/environment/{code} — needed to fill `environment_id` when starting a run
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const { limit, offset } = paging(req);
  const where = { projectId: ctx.projectId };
  const [total, rows] = await Promise.all([
    prisma.environment.count({ where }),
    prisma.environment.findMany({ where, orderBy: { title: "asc" }, skip: offset, take: limit }),
  ]);
  return ok(listEnvelope(rows.map(serializeEnvironment), total, limit, offset));
});

// POST /api/v1/environment/{code}
export const POST = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, WRITE_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const body = await readJson<any>(req);
  if (!body?.title?.trim()) return fail("'title' is required.", 422);

  const slug = String(body.slug ?? body.title)
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return fail("'slug' could not be derived — pass one explicitly.", 422);

  const clash = await prisma.environment.findFirst({
    where: { projectId: ctx.projectId, slug }, select: { id: true },
  });
  if (clash) return fail(`An environment with slug '${slug}' already exists.`, 409);

  const created = await prisma.environment.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      slug,
      projectId: ctx.projectId,
    },
  });
  return ok(serializeEnvironment(created), 201);
});
