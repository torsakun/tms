import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, PUT } from "@/app/api/projects/[code]/integrations/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

function jsonRequest(method: string, code: string, body?: unknown) {
  return new Request(`http://localhost/api/projects/${code}/integrations`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

const fakeUser = { id: "user-001", email: "admin@example.com", role: "ADMIN" };
const fakeProject = {
  id: "proj-fin", code: "FIN",
  githubOwner: "acme", githubRepo: "tests",
  githubWorkflowId: "playwright.yml", githubToken: "gh-token",
  msTeamsWebhookUrl: null,
};

describe("GET /api/projects/[code]/integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/projects/FIN/integrations"), routeParams("FIN"));

    expect(res.status).toBe(401);
    expect(projectMock.findUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not ADMIN", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { ...fakeUser, role: "USER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await GET(new Request("http://localhost/api/projects/FIN/integrations"), routeParams("FIN"));

    expect(res.status).toBe(403);
  });

  it("returns 404 when project not found", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.findUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/projects/NOTEXIST/integrations"), routeParams("NOTEXIST"));

    expect(res.status).toBe(404);
  });

  it("returns integration settings for project", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.findUnique.mockResolvedValue(fakeProject);

    const res = await GET(new Request("http://localhost/api/projects/FIN/integrations"), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.integrations.githubOwner).toBe("acme");
    expect(body.integrations.githubRepo).toBe("tests");
  });
});

describe("PUT /api/projects/[code]/integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await PUT(jsonRequest("PUT", "FIN", { githubOwner: "acme" }), routeParams("FIN"));

    expect(res.status).toBe(401);
    expect(projectMock.update).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not ADMIN", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { ...fakeUser, role: "USER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await PUT(jsonRequest("PUT", "FIN", { githubOwner: "acme" }), routeParams("FIN"));

    expect(res.status).toBe(403);
  });

  it("updates integration settings and returns project", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.update.mockResolvedValue({ ...fakeProject, githubOwner: "new-owner" });

    const res = await PUT(
      jsonRequest("PUT", "FIN", { githubOwner: "new-owner", githubRepo: "tests" }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(projectMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ githubOwner: "new-owner" }) })
    );
  });

  it("sets fields to null when values are empty strings", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.update.mockResolvedValue(fakeProject);

    await PUT(
      jsonRequest("PUT", "FIN", { githubOwner: "", githubRepo: "", githubToken: "" }),
      routeParams("FIN")
    );

    expect(projectMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ githubOwner: null, githubRepo: null, githubToken: null }),
      })
    );
  });
});
