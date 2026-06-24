import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Global search across test cases and test runs (by title).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ cases: [], runs: [] });
  }

  try {
    const [cases, runs] = await Promise.all([
      prisma.testCase.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          sequenceNumber: true,
          project: { select: { code: true, name: true } },
        },
      }),
      prisma.testRun.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { code: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      cases: cases.map((c) => ({
        id: c.id,
        title: c.title,
        code: `${c.project.code}-${c.sequenceNumber}`,
        projectCode: c.project.code,
        projectName: c.project.name,
      })),
      runs: runs.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        projectCode: r.project.code,
        projectName: r.project.name,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
