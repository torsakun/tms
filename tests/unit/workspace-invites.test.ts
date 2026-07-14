import { beforeEach, describe, expect, it, vi } from "vitest";

const invitationMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

const userMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

const workspaceRoleMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

const sendEmailMock = vi.hoisted(() => vi.fn());
const generateInviteEmailHtmlMock = vi.hoisted(() => vi.fn().mockReturnValue("<html>invite</html>"));

const apiAuthMock = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  unauthorized: vi.fn(
    () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  ),
  forbidden: vi.fn(
    () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
  ),
}));

vi.mock("@/lib/api-auth", () => apiAuthMock);

vi.mock("@/lib/prisma", () => ({
  prisma: { invitation: invitationMock, user: userMock, workspaceRole: workspaceRoleMock },
}));

vi.mock("uuid", () => ({ v4: () => "test-uuid-token" }));

vi.mock("@/lib/mailer", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("@/lib/email-templates", () => ({
  generateInviteEmailHtml: generateInviteEmailHtmlMock,
}));

import { GET, POST } from "@/app/api/workspace/invites/route";

function jsonRequest(body?: unknown) {
  return new Request("http://localhost/api/workspace/invites", {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

const validBody = {
  email: "newuser@example.com",
  firstName: "New",
  lastName: "User",
  roleTitle: "Editor",
  roleId: "role-001",
};

describe("GET /api/workspace/invites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of pending invites with role names", async () => {
    invitationMock.findMany.mockResolvedValue([
      { id: "inv-1", email: "a@b.com", roleId: "role-001", status: "PENDING" },
    ]);
    workspaceRoleMock.findMany.mockResolvedValue([{ id: "role-001", title: "Editor" }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.invites[0].accessRoleName).toBe("Editor");
  });
});

describe("POST /api/workspace/invites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiAuthMock.getSessionUser.mockResolvedValue({
      id: "u1",
      role: "ADMIN",
      workspaceRole: { permissions: ["all"] },
    });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(jsonRequest({ email: "a@b.com" }));

    expect(res.status).toBe(400);
    expect(invitationMock.create).not.toHaveBeenCalled();
  });

  it("returns 400 when user already exists", async () => {
    userMock.findUnique.mockResolvedValue({ id: "existing-user" });

    const res = await POST(jsonRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/already exists/);
    expect(invitationMock.create).not.toHaveBeenCalled();
  });

  it("creates invitation and sends email successfully", async () => {
    userMock.findUnique.mockResolvedValue(null);
    invitationMock.create.mockResolvedValue({ id: "inv-2", ...validBody, token: "test-uuid-token" });
    sendEmailMock.mockResolvedValue({ success: true });

    const res = await POST(jsonRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: validBody.email })
    );
  });

  it("deletes invitation and returns 500 when email fails to send", async () => {
    userMock.findUnique.mockResolvedValue(null);
    invitationMock.create.mockResolvedValue({ id: "inv-3", ...validBody });
    sendEmailMock.mockResolvedValue({ success: false, error: "SMTP error" });

    const res = await POST(jsonRequest(validBody));

    expect(res.status).toBe(500);
    expect(invitationMock.delete).toHaveBeenCalledWith({ where: { id: "inv-3" } });
  });
});
