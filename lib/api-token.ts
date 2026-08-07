import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const TOKEN_PREFIX = "qm_";

/**
 * Mint a new personal access token.
 *
 * Returns the plaintext exactly once — only its SHA-256 hash is persisted, so
 * a lost token can never be recovered, only revoked and replaced.
 */
export function generateToken(): { plaintext: string; hash: string; prefix: string } {
  const secret = crypto.randomBytes(32).toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${secret}`;
  return {
    plaintext,
    hash: hashToken(plaintext),
    // Enough to recognise a token in a list without being usable on its own.
    prefix: plaintext.slice(0, TOKEN_PREFIX.length + 6),
  };
}

export function hashToken(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext.trim()).digest("hex");
}

export type ApiActor = {
  userId: string;
  tokenId: string;
  email: string;
  name: string | null;
  isSystemAdmin: boolean;
};

export type ApiAuthFailure = { error: string; status: 401 };

/**
 * Resolve the caller of an /api/v1 request from its token.
 *
 * Accepted headers (both work, so Qase-style clients and generic HTTP clients
 * need no special casing):
 *   Token: qm_xxx
 *   Authorization: Bearer qm_xxx
 */
export async function authenticateApiRequest(
  req: Request,
): Promise<ApiActor | ApiAuthFailure> {
  const raw =
    req.headers.get("token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const presented = raw.trim();

  if (!presented) {
    return { error: "Missing API token. Send it as a 'Token' header.", status: 401 };
  }

  const record = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(presented) },
    select: {
      id: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
    },
  });

  if (!record) return { error: "Invalid API token.", status: 401 };
  if (record.revokedAt) return { error: "This API token has been revoked.", status: 401 };
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { error: "This API token has expired.", status: 401 };
  }
  if (!record.user.isActive) {
    return { error: "The user this token belongs to is deactivated.", status: 401 };
  }

  // Best-effort usage stamp; never let it fail the request.
  prisma.apiToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    userId: record.user.id,
    tokenId: record.id,
    email: record.user.email,
    name: record.user.name,
    isSystemAdmin: record.user.role === "ADMIN",
  };
}

export function isAuthFailure(v: ApiActor | ApiAuthFailure): v is ApiAuthFailure {
  return (v as ApiAuthFailure).status === 401;
}
