import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const userMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const projectMemberMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const projectInvitationMock = vi.hoisted(() => ({ upsert: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, user: userMock, projectMember: projectMemberMock, projectInvitation: projectInvitationMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mailer", () => ({ sendEmail: sendEmailMock }));
vi.mock("@/lib/email-templates", () => ({ generateInviteEmailHtml: vi.fn(() => "<html>invite</html>") }));

import { POST } from "@/app/api/projects/[code]/invitations/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/projects/FIN/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost", ...headers },
    body: JSON.stringify(body),
  });

describe("POST /api/projects/[code]/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    requireProjectRoleMock.mockResolvedValue(true);
    projectMock.findUnique.mockResolvedValue({ id: "proj-fin", code: "FIN", name: "Finance" });
    userMock.findUnique.mockResolvedValue(null);
    projectMemberMock.findUnique.mockResolvedValue(null);
    projectInvitationMock.upsert.mockResolvedValue({ id: "inv-001", email: "new@example.com", role: "EDITOR" });
    sendEmailMock.mockResolvedValue(undefined);
  });

  it("returns 401 when no session", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "new@example.com", role: "EDITOR" }), routeParams("FIN"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when requireProjectRole returns false and user is not ADMIN", async () => {
    requireProjectRoleMock.mockResolvedValue(false);
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const res = await POST(makeRequest({ email: "new@example.com", role: "EDITOR" }), routeParams("FIN"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/Forbidden/i);
  });

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "new@example.com", role: "EDITOR" }), routeParams("FIN"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });

  it("returns 400 when email or role is missing", async () => {
    const resNoEmail = await POST(makeRequest({ role: "EDITOR" }), routeParams("FIN"));
    const jsonNoEmail = await resNoEmail.json();
    expect(resNoEmail.status).toBe(400);
    expect(jsonNoEmail.error).toBe("Email and role are required");

    const resNoRole = await POST(makeRequest({ email: "new@example.com" }), routeParams("FIN"));
    const jsonNoRole = await resNoRole.json();
    expect(resNoRole.status).toBe(400);
    expect(jsonNoRole.error).toBe("Email and role are required");
  });

  it("returns 400 when user is already a project member", async () => {
    userMock.findUnique.mockResolvedValue({ id: "existing-user", email: "existing@example.com" });
    projectMemberMock.findUnique.mockResolvedValue({ userId: "existing-user", projectId: "proj-fin" });

    const res = await POST(makeRequest({ email: "existing@example.com", role: "EDITOR" }), routeParams("FIN"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("User is already a member of this project");
  });

  it("returns 201 with success on valid invitation: upserts invitation and calls sendEmail", async () => {
    const res = await POST(makeRequest({ email: "new@example.com", role: "EDITOR" }), routeParams("FIN"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.invitationId).toBe("inv-001");

    expect(projectInvitationMock.upsert).toHaveBeenCalledOnce();
    const upsertCall = projectInvitationMock.upsert.mock.calls[0][0];
    expect(upsertCall.where.email_projectId).toEqual({ email: "new@example.com", projectId: "proj-fin" });
    expect(upsertCall.create.role).toBe("EDITOR");
    expect(upsertCall.create.token).toBeTypeOf("string");
    expect(upsertCall.create.token.length).toBe(64);
    expect(upsertCall.create.expiresAt).toBeInstanceOf(Date);

    const expiresAt: Date = upsertCall.create.expiresAt;
    const now = new Date();
    const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6.9);
    expect(diffDays).toBeLessThan(7.1);

    expect(sendEmailMock).toHaveBeenCalledOnce();
    const emailCall = sendEmailMock.mock.calls[0][0];
    expect(emailCall.to).toBe("new@example.com");
    expect(emailCall.subject).toContain("Finance");
    expect(emailCall.html).toBe("<html>invite</html>");
  });

  it("skips member check and still creates invitation when user is not found", async () => {
    userMock.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "unknown@example.com", role: "VIEWER" }), routeParams("FIN"));
    const json = await res.json();

    expect(projectMemberMock.findUnique).not.toHaveBeenCalled();
    expect(projectInvitationMock.upsert).toHaveBeenCalledOnce();
    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(json.success).toBe(true);
  });
});
