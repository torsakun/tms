import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { handler, listEnvelope, ok, paging, READ_ROLES, requireProject } from "@/lib/api-v1";
import { serializeDefect } from "@/lib/api-v1-serializers";
import { NextResponse } from "next/server";

// GET /api/v1/defect/{code} — bugs linked to cases/results.
// Read-only: defects live in Jira/GitHub, so creating one goes through the
// integration rather than this API, which would otherwise drift out of sync.
// Filters: ?case_id= &result_id= &provider=JIRA|GITHUB
export const GET = handler(async (req, { params }) => {
  const { code } = await params;
  const ctx = await requireProject(req, code, READ_ROLES);
  if (ctx instanceof NextResponse) return ctx;

  const { limit, offset } = paging(req);
  const q = new URL(req.url).searchParams;

  const where: Prisma.LinkedIssueWhereInput = { projectId: ctx.projectId };
  if (q.get("case_id")) where.caseId = q.get("case_id");
  if (q.get("result_id")) where.resultId = q.get("result_id");
  if (q.get("provider")) where.provider = q.get("provider")!.toUpperCase();

  const [total, rows] = await Promise.all([
    prisma.linkedIssue.count({ where }),
    prisma.linkedIssue.findMany({ where, orderBy: { createdAt: "desc" }, skip: offset, take: limit }),
  ]);
  return ok(listEnvelope(rows.map(serializeDefect), total, limit, offset));
});
