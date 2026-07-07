import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { PUT as updateProfile } from "@/app/api/user/profile/route";
import { GET as publicReport } from "@/app/api/public/reports/[runId]/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { GET as validateReset, POST as consumeReset } from "@/app/api/auth/reset-password/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    testRun: { findUnique: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("bcrypt", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("uuid", () => ({ v4: () => "fixed-token" }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "m1" }) }));
vi.mock("@/lib/email-templates", () => ({ generateResetEmailHtml: () => "<p>reset</p>" }));

const mockedSession = vi.mocked(getServerSession);
const mockedBcrypt = vi.mocked(bcrypt);
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;
const runFindUnique = prisma.testRun.findUnique as unknown as Mock;
const tokenFindUnique = prisma.passwordResetToken.findUnique as unknown as Mock;
const tokenCreate = prisma.passwordResetToken.create as unknown as Mock;
const tokenUpdate = prisma.passwordResetToken.update as unknown as Mock;
const tokenUpdateMany = prisma.passwordResetToken.updateMany as unknown as Mock;
const prismaTransaction = prisma.$transaction as unknown as Mock;

const req = (body: unknown, url = "http://qmaster.test/api") =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json", host: "qmaster.test" }, body: JSON.stringify(body) });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("account, public report, and password reset routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedSession.mockResolvedValue({ user: { email: "user@example.com" } });
    userFindUnique.mockResolvedValue({ id: "user-1", email: "user@example.com", name: "User", passwordHash: "old", isActive: true });
    userUpdate.mockResolvedValue({});
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedBcrypt.hash.mockResolvedValue("new-hash" as never);
    runFindUnique.mockResolvedValue({ id: "run-1", isPublic: true });
    tokenFindUnique.mockResolvedValue({ id: "token-1", token: "abc", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: null });
    tokenCreate.mockResolvedValue({});
    tokenUpdate.mockReturnValue({});
    tokenUpdateMany.mockReturnValue({});
    prismaTransaction.mockResolvedValue([]);
  });

  it("requires auth before profile updates", async () => {
    mockedSession.mockResolvedValue(null);
    const response = await updateProfile(req({ name: "New" }));
    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Unauthorized" });
  });

  it("validates current password before changing password", async () => {
    mockedBcrypt.compare.mockResolvedValue(false as never);
    const response = await updateProfile(req({ currentPassword: "bad", newPassword: "secret1" }));
    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Incorrect current password." });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("updates profile name and password hash", async () => {
    const response = await updateProfile(req({ name: "New Name", currentPassword: "old", newPassword: "secret1" }));
    expect(response.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: { name: "New Name", passwordHash: "new-hash" },
    });
  });

  it("returns public reports only when the run is public", async () => {
    const ok = await publicReport(new Request("http://qmaster.test"), { params: Promise.resolve({ runId: "run-1" }) });
    runFindUnique.mockResolvedValue({ id: "run-1", isPublic: false });
    const forbidden = await publicReport(new Request("http://qmaster.test"), { params: Promise.resolve({ runId: "run-1" }) });
    expect(ok.status).toBe(200);
    expect(forbidden.status).toBe(403);
  });

  it("forgot password does not reveal inactive or unknown accounts", async () => {
    userFindUnique.mockResolvedValue(null);
    const response = await forgotPassword(req({ email: "missing@example.com" }));
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true });
    expect(tokenCreate).not.toHaveBeenCalled();
  });

  it("validates and consumes reset tokens", async () => {
    const valid = await validateReset(new Request("http://qmaster.test/api/auth/reset-password?token=abc"));
    const consumed = await consumeReset(req({ token: "abc", password: "secret1" }));
    expect(valid.status).toBe(200);
    expect(await json(valid)).toEqual({ valid: true });
    expect(consumed.status).toBe(200);
    expect(prismaTransaction).toHaveBeenCalledWith(expect.arrayContaining([expect.anything(), expect.anything(), expect.anything()]));
  });
});
