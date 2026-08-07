import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/api-token";

/**
 * Manage the caller's own API tokens.
 *
 * Session-authenticated (this is the web UI): a token can never be used to mint
 * another token, so a leaked token can't quietly extend its own lifetime.
 */

async function currentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await prisma.apiToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(tokens);
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });

  let expiresAt: Date | null = null;
  if (body?.expiresInDays) {
    const days = Number(body.expiresInDays);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "expiresInDays must be a positive number" }, { status: 400 });
    }
    expiresAt = new Date(Date.now() + days * 86_400_000);
  }

  const { plaintext, hash, prefix } = generateToken();

  const created = await prisma.apiToken.create({
    data: { name, tokenHash: hash, prefix, userId, expiresAt },
    select: { id: true, name: true, prefix: true, expiresAt: true, createdAt: true },
  });

  // The only time the plaintext is ever returned.
  return NextResponse.json({ ...created, token: plaintext }, { status: 201 });
}
