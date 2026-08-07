import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/profile/api-tokens/{id} — revoke a token
//
// Revoked rather than deleted: the row keeps a record that the token existed
// and when it was last used, which matters when working out what a leaked
// token could have touched.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await prisma.apiToken.findFirst({
    where: { id, userId },
    select: { id: true, revokedAt: true },
  });
  if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });
  if (token.revokedAt) return NextResponse.json({ success: true });

  await prisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ success: true });
}
