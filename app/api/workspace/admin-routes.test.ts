import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";
import { canManageUsers, canManageWorkspace } from "@/lib/permissions";
import { sendEmail } from "@/lib/mailer";
import { POST as createGroup } from "@/app/api/workspace/groups/route";
import { DELETE as deleteGroup, PATCH as updateGroup } from "@/app/api/workspace/groups/[id]/route";
import { POST as createInvite } from "@/app/api/workspace/invites/route";
import { POST as resendInvite } from "@/app/api/workspace/invites/[id]/resend/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    group: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    workspaceRole: {
      findUnique: vi.fn(),
    },
    invitation: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getSessionUser: vi.fn(),
  unauthorized: () => NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => NextResponse.json({ error: "Forbidden" }, { status: 403 }),
}));

vi.mock("@/lib/permissions", () => ({
  canManageUsers: vi.fn(),
  canManageWorkspace: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "fixed-token",
}));

vi.mock("@/lib/mailer", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email-templates", () => ({
  generateInviteEmailHtml: () => "<p>invite</p>",
}));

const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedCanManageUsers = vi.mocked(canManageUsers);
const mockedCanManageWorkspace = vi.mocked(canManageWorkspace);
const mockedSendEmail = vi.mocked(sendEmail);
const groupCreate = prisma.group.create as unknown as Mock;
const groupUpdate = prisma.group.update as unknown as Mock;
const groupDelete = prisma.group.delete as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const roleFindUnique = prisma.workspaceRole.findUnique as unknown as Mock;
const inviteCreate = prisma.invitation.create as unknown as Mock;
const inviteDelete = prisma.invitation.delete as unknown as Mock;
const inviteFindUnique = prisma.invitation.findUnique as unknown as Mock;
const inviteUpdate = prisma.invitation.update as unknown as Mock;

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;
const req = (body: unknown, method = "POST") =>
  new Request("http://qmaster.test/api", {
    method,
    headers: { "content-type": "application/json", host: "qmaster.test" },
    body: JSON.stringify(body),
  });
const params = (id = "entity-1") => ({ params: Promise.resolve({ id }) });

describe("workspace groups and invite admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSessionUser.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      workspaceRole: null,
    });
    mockedCanManageUsers.mockReturnValue(true);
    mockedCanManageWorkspace.mockReturnValue(true);
    mockedSendEmail.mockResolvedValue({ success: true, messageId: "message-1" });
  });

  it("requires workspace management permission before creating groups", async () => {
    mockedCanManageWorkspace.mockReturnValue(false);

    const response = await createGroup(req({ title: "QA" }) as never);

    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "Forbidden" });
    expect(groupCreate).not.toHaveBeenCalled();
  });

  it("validates group titles before create and update", async () => {
    const createResponse = await createGroup(req({ title: "   " }) as never);
    const updateResponse = await updateGroup(req({ title: "" }, "PATCH") as never, params("group-1"));

    expect(createResponse.status).toBe(400);
    expect(updateResponse.status).toBe(400);
    expect(groupCreate).not.toHaveBeenCalled();
    expect(groupUpdate).not.toHaveBeenCalled();
  });

  it("creates groups with trimmed title and connected members", async () => {
    groupCreate.mockResolvedValue({
      id: "group-1",
      title: "QA Team",
      description: "Release quality",
      _count: { members: 2, projects: 0 },
    });

    const response = await createGroup(
      req({ title: " QA Team ", description: " Release quality ", memberIds: ["u1", "u2"] }) as never,
    );

    expect(response.status).toBe(201);
    expect(await json(response)).toMatchObject({ id: "group-1", members: 2 });
    expect(groupCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "QA Team",
          description: "Release quality",
          members: { connect: [{ id: "u1" }, { id: "u2" }] },
        }),
      }),
    );
  });

  it("deletes groups only after auth and permission checks pass", async () => {
    groupDelete.mockResolvedValue({});

    const response = await deleteGroup(new Request("http://qmaster.test", { method: "DELETE" }) as never, params("group-1"));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true });
    expect(groupDelete).toHaveBeenCalledWith({ where: { id: "group-1" } });
  });

  it("rejects invite creation when the target email already exists", async () => {
    userFindUnique.mockResolvedValue({ id: "u1" });

    const response = await createInvite(req({ email: "member@example.com", roleId: "role-1" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "User already exists with this email" });
    expect(inviteCreate).not.toHaveBeenCalled();
  });

  it("rolls back a created invite when email delivery fails", async () => {
    userFindUnique.mockResolvedValue(null);
    roleFindUnique.mockResolvedValue({ id: "role-1", title: "Member" });
    inviteCreate.mockResolvedValue({
      id: "invite-1",
      email: "member@example.com",
      firstName: "member",
      lastName: "",
      roleTitle: "Member",
      token: "fixed-token",
    });
    mockedSendEmail.mockResolvedValue({ success: false, error: "SMTP down" });

    const response = await createInvite(req({ email: "member@example.com", roleId: "role-1" }));

    expect(response.status).toBe(500);
    expect(await json(response)).toEqual({ error: "Failed to send email: SMTP down" });
    expect(inviteDelete).toHaveBeenCalledWith({ where: { id: "invite-1" } });
  });

  it("returns 404 when resending a missing invitation", async () => {
    inviteFindUnique.mockResolvedValue(null);

    const response = await resendInvite(new Request("http://qmaster.test", { method: "POST" }), params("missing"));

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "Invitation not found" });
    expect(inviteUpdate).not.toHaveBeenCalled();
  });
});
