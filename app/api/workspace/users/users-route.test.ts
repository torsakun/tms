import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { sendEmail } from "@/lib/mailer";
import { PATCH } from "@/app/api/workspace/users/[id]/route";
import { POST as resetPassword } from "@/app/api/workspace/users/[id]/reset-password/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceRole: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("uuid", () => ({
  v4: () => "fixed-token",
}));

vi.mock("@/lib/mailer", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email-templates", () => ({
  generateResetEmailHtml: () => "<p>reset</p>",
}));

const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;
const workspaceRoleFindUnique = prisma.workspaceRole.findUnique as unknown as Mock;
const passwordResetCreate = prisma.passwordResetToken.create as unknown as Mock;
const mockedGetServerSession = vi.mocked(getServerSession);
const mockedSendEmail = vi.mocked(sendEmail);

const params = (id = "target-1") => ({ params: Promise.resolve({ id }) });
const request = (body: unknown = {}, host = "test.local") =>
  new Request(`http://${host}/api/workspace/users/target-1`, {
    method: "PATCH",
    headers: { "content-type": "application/json", host },
    body: JSON.stringify(body),
  });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("workspace user admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@example.com" } });
    userFindUnique.mockImplementation(({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email) {
        return Promise.resolve({
          id: "admin-1",
          email: where.email,
          role: "ADMIN",
          workspaceRole: null,
        });
      }
      return Promise.resolve({
        id: where.id,
        email: "target@example.com",
        name: "Target User",
      });
    });
    userUpdate.mockResolvedValue({});
    workspaceRoleFindUnique.mockResolvedValue({ id: "role-1" });
    passwordResetCreate.mockResolvedValue({});
    mockedSendEmail.mockResolvedValue({ success: true, messageId: "message-1" });
  });

  it("rejects unauthenticated user mutations", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await PATCH(request({ action: "activate" }), params());

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Unauthorized" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("prevents admins from deactivating their own account", async () => {
    userFindUnique.mockImplementation(({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email) return Promise.resolve({ id: "admin-1", email: where.email, role: "ADMIN" });
      return Promise.resolve({ id: "admin-1", email: "admin@example.com" });
    });

    const response = await PATCH(request({ action: "deactivate" }), params("admin-1"));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Cannot deactivate your own account" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("activates and deactivates target users", async () => {
    const deactivate = await PATCH(request({ action: "deactivate" }), params("target-1"));
    const activate = await PATCH(request({ action: "activate" }), params("target-1"));

    expect(deactivate.status).toBe(200);
    expect(activate.status).toBe(200);
    expect(userUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "target-1" },
      data: { isActive: false },
    });
    expect(userUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "target-1" },
      data: { isActive: true },
    });
  });

  it("validates role existence before changing a user's workspace role", async () => {
    workspaceRoleFindUnique.mockResolvedValue(null);

    const response = await PATCH(request({ action: "change_role", roleId: "missing-role" }), params());

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "Role not found" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("creates a password reset token and returns a shareable reset link", async () => {
    const response = await PATCH(request({ action: "reset_password" }, "qmaster.test"), params("target-1"));

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({
      success: true,
      resetLink: "http://qmaster.test/reset-password?token=fixed-token",
    });
    expect(passwordResetCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ token: "fixed-token", userId: "target-1" }),
    });
  });

  it("emails admin-issued reset links when mail delivery works", async () => {
    const response = await resetPassword(
      new Request("http://qmaster.test/api/workspace/users/target-1/reset-password", {
        method: "POST",
        headers: { host: "qmaster.test" },
      }),
      params("target-1"),
    );

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({
      success: true,
      emailed: true,
      resetLink: "http://qmaster.test/reset-password?token=fixed-token",
    });
    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "target@example.com" }),
    );
  });
});
