import { beforeEach, describe, expect, it, vi } from "vitest";

const userMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

const workspaceRoleMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

const passwordResetTokenMock = vi.hoisted(() => ({
  create: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: userMock,
    workspaceRole: workspaceRoleMock,
    passwordResetToken: passwordResetTokenMock,
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: sessionMock.getServerSession,
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("bcrypt", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed-pw") } }));

import { PATCH } from "@/app/api/workspace/users/[id]/route";

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function jsonRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/workspace/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const adminUser = { id: "admin-001", email: "admin@example.com", role: "ADMIN" };
const targetUser = { id: "user-002", email: "user@example.com", role: "USER", isActive: true };

describe("PATCH /api/workspace/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userMock.findUnique
      .mockResolvedValueOnce(adminUser)   // currentUser lookup
      .mockResolvedValueOnce(targetUser); // targetUser lookup
    userMock.update.mockResolvedValue({ ...targetUser });
  });

  it("returns 401 when user is not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await PATCH(jsonRequest("user-002", { action: "deactivate" }), routeParams("user-002"));

    expect(res.status).toBe(401);
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("returns 403 when caller is not ADMIN", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { email: "user@example.com" } });
    userMock.findUnique.mockReset();
    userMock.findUnique.mockResolvedValue({ ...adminUser, role: "USER" });

    const res = await PATCH(jsonRequest("user-002", { action: "deactivate" }), routeParams("user-002"));

    expect(res.status).toBe(403);
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("deactivates target user successfully", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { email: "admin@example.com" } });

    const res = await PATCH(jsonRequest("user-002", { action: "deactivate" }), routeParams("user-002"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(userMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });

  it("returns 400 when admin tries to deactivate own account", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { email: "admin@example.com" } });
    userMock.findUnique.mockReset();
    userMock.findUnique
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(adminUser); // targetUser is same as currentUser

    const res = await PATCH(jsonRequest("admin-001", { action: "deactivate" }), routeParams("admin-001"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Cannot deactivate your own account/);
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("generates a password reset token and returns a reset link", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { email: "admin@example.com" } });
    passwordResetTokenMock.create.mockResolvedValue({ token: "reset-token" });

    const res = await PATCH(jsonRequest("user-002", { action: "reset_password" }), routeParams("user-002"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.resetLink).toContain("/reset-password?token=");
    expect(passwordResetTokenMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-002" }) })
    );
  });
});
