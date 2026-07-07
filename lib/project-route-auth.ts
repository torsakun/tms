import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import type { ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProjectSession = {
  userId: string;
  userRole?: string;
};

export async function getProjectSession(): Promise<ProjectSession | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const userRole = (session.user as { role?: string }).role;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId, userRole };
}

export async function requireProjectAccess(
  projectCode: string,
  allowedRoles: ProjectRole[] = ["EDITOR", "ADMIN"],
): Promise<ProjectSession | NextResponse> {
  const session = await getProjectSession();
  if (session instanceof NextResponse) return session;

  const hasAccess = await requireProjectRole(
    projectCode,
    session.userId,
    allowedRoles,
  );
  if (!hasAccess && session.userRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to modify this project" },
      { status: 403 },
    );
  }

  return session;
}

export async function requireRunAccess(
  runId: string,
  allowedRoles: ProjectRole[] = ["EDITOR", "ADMIN"],
): Promise<ProjectSession | NextResponse> {
  const session = await getProjectSession();
  if (session instanceof NextResponse) return session;

  const run = await prisma.testRun.findUnique({
    where: { id: runId },
    select: { project: { select: { code: true } } },
  });
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const hasAccess = await requireProjectRole(
    run.project.code,
    session.userId,
    allowedRoles,
  );
  if (!hasAccess && session.userRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to modify this run" },
      { status: 403 },
    );
  }

  return session;
}
