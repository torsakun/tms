import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { GET as getNotifications, PATCH as markNotifications } from "@/app/api/notifications/route";
import { PATCH as markOneNotification } from "@/app/api/notifications/[id]/read/route";
import { GET as inviteStatus } from "@/app/api/auth/invite-status/route";
import { POST as acceptInvite } from "@/app/api/auth/accept-invite/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    invitation: { findUnique: vi.fn(), update: vi.fn() },
    workspaceRole: { findFirst: vi.fn() },
    user: { create: vi.fn() },
  },
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("bcrypt", () => ({ default: { hash: vi.fn() } }));

const mockedSession = vi.mocked(getServerSession);
const mockedBcrypt = vi.mocked(bcrypt);
const notificationFindMany = prisma.notification.findMany as unknown as Mock;
const notificationCount = prisma.notification.count as unknown as Mock;
const notificationUpdateMany = prisma.notification.updateMany as unknown as Mock;
const notificationFindUnique = prisma.notification.findUnique as unknown as Mock;
const notificationUpdate = prisma.notification.update as unknown as Mock;
const invitationFindUnique = prisma.invitation.findUnique as unknown as Mock;
const invitationUpdate = prisma.invitation.update as unknown as Mock;
const roleFindFirst = prisma.workspaceRole.findFirst as unknown as Mock;
const userCreate = prisma.user.create as unknown as Mock;

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;
const req = (body?: unknown, url = "http://qmaster.test/api") =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

describe("notifications and invitation auth routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedSession.mockResolvedValue({ user: { id: "user-1", email: "u@example.com" } });
    notificationFindMany.mockResolvedValue([{ id: "n1" }]);
    notificationCount.mockResolvedValue(3);
    notificationUpdateMany.mockResolvedValue({});
    notificationFindUnique.mockResolvedValue({ id: "n1", recipientId: "user-1" });
    notificationUpdate.mockResolvedValue({});
    invitationFindUnique.mockResolvedValue({
      id: "invite-1",
      token: "tok",
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
      roleId: null,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60_000),
    });
    invitationUpdate.mockResolvedValue({});
    roleFindFirst.mockResolvedValue({ id: "role-default" });
    userCreate.mockResolvedValue({ id: "user-2", email: "new@example.com" });
    mockedBcrypt.hash.mockResolvedValue("hash" as never);
  });

  it("lists notifications and unread count for current user", async () => {
    const response = await getNotifications(new Request("http://qmaster.test/api/notifications"));
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ notifications: [{ id: "n1" }], unreadCount: 3 });
    expect(notificationFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { recipientId: "user-1" }, take: 50 }));
  });

  it("marks one or all notifications as read scoped to the user", async () => {
    const one = await markNotifications(req({ id: "n1" }, "http://qmaster.test/api/notifications"));
    const all = await markNotifications(new Request("http://qmaster.test/api/notifications", { method: "PATCH" }));
    expect(one.status).toBe(200);
    expect(all.status).toBe(200);
    expect(notificationUpdateMany).toHaveBeenNthCalledWith(1, { where: { id: "n1", recipientId: "user-1" }, data: { isRead: true } });
    expect(notificationUpdateMany).toHaveBeenNthCalledWith(2, { where: { recipientId: "user-1", isRead: false }, data: { isRead: true } });
  });

  it("does not allow reading another user's notification", async () => {
    notificationFindUnique.mockResolvedValue({ id: "n1", recipientId: "someone-else" });
    const response = await markOneNotification(new Request("http://qmaster.test", { method: "PATCH" }), { params: Promise.resolve({ id: "n1" }) });
    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "Not found" });
  });

  it("validates invitation token status and expiry", async () => {
    const ok = await inviteStatus(new Request("http://qmaster.test/api/auth/invite-status?token=tok"));
    invitationFindUnique.mockResolvedValue({ status: "ACCEPTED", expiresAt: new Date(Date.now() + 60_000) });
    const accepted = await inviteStatus(new Request("http://qmaster.test/api/auth/invite-status?token=tok"));
    expect(ok.status).toBe(200);
    expect(accepted.status).toBe(400);
  });

  it("accepts a pending invite and assigns default workspace role when missing", async () => {
    const response = await acceptInvite(req({ token: "tok", password: "secret1" }, "http://qmaster.test/api/auth/accept-invite"));
    expect(response.status).toBe(200);
    expect(userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "new@example.com",
        name: "New User",
        workspaceRoleId: "role-default",
      }),
    });
    expect(invitationUpdate).toHaveBeenCalledWith({ where: { id: "invite-1" }, data: { status: "ACCEPTED" } });
  });
});
