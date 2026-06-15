import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  role: string;
  workspaceRole: { permissions: unknown } | null;
};

/** Resolve the current session user with their workspace role. Returns null if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, workspaceRole: { select: { permissions: true } } },
  });
  return user as SessionUser | null;
}

/** Return a 401 response — shorthand for unauthenticated routes. */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Return a 403 response — shorthand for forbidden routes. */
export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
