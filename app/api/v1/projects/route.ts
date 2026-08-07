import { prisma } from "@/lib/prisma";
import { getProjectRole } from "@/lib/project-auth";
import { handler, listEnvelope, ok, paging, requireActor } from "@/lib/api-v1";
import { serializeProject } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/projects — projects this token can see
export const GET = handler(async (req) => {
  const actor = await requireActor(req);
  if (actor instanceof NextResponse) return actor;

  const { limit, offset } = paging(req);
  const includeArchived = new URL(req.url).searchParams.get("archived") === "true";

  const where = includeArchived ? {} : { isArchived: false };
  const all = await prisma.project.findMany({
    where,
    orderBy: { code: "asc" },
    include: { _count: { select: { testCases: true, suites: true, testRuns: true } } },
  });

  // getProjectRole already encodes "system admins see everything, everyone else
  // gets at least VIEWER on public projects", so filter through it rather than
  // duplicating the visibility rules here.
  const visible = [];
  for (const p of all) {
    if (await getProjectRole(p.code, actor.userId)) visible.push(p);
  }

  const page = visible.slice(offset, offset + limit);
  return ok(listEnvelope(page.map(serializeProject), visible.length, limit, offset));
});
