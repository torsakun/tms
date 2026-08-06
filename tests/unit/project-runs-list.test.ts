import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn() }));
const testRunMock = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());
const logAuditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, testRun: testRunMock, testCase: testCaseMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-logger", () => ({ logAudit: logAuditMock }));

import { POST } from "@/app/api/projects/[code]/runs/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/TEST/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/projects/[code]/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when project not found", async () => {
    projectMock.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({}), routeParams("NOTFOUND"));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Project not found");
  });

  it("returns 401 when no session", async () => {
    projectMock.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest({}), routeParams("TEST"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user lacks project role", async () => {
    projectMock.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "VIEWER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await POST(makeRequest({ caseIds: ["case1"] }), routeParams("TEST"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Forbidden/);
  });

  it("returns 400 when caseIds is empty", async () => {
    projectMock.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "EDITOR" } });
    requireProjectRoleMock.mockResolvedValue(true);

    const res = await POST(makeRequest({ caseIds: [] }), routeParams("TEST"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No test cases selected");
  });

  it("returns 201 and calls logAudit on success", async () => {
    const project = { id: "proj1", code: "TEST" };
    const run = { id: "run1", title: "My Run", results: [] };

    projectMock.findFirst.mockResolvedValue(project);
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "EDITOR" } });
    requireProjectRoleMock.mockResolvedValue(true);
    testCaseMock.findMany.mockResolvedValue([{ id: "case1" }, { id: "case2" }]);
    testRunMock.create.mockResolvedValue(run);
    logAuditMock.mockResolvedValue(undefined);

    const res = await POST(
      makeRequest({ title: "My Run", caseIds: ["case1", "case2"] }),
      routeParams("TEST")
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("run1");

    expect(testRunMock.create).toHaveBeenCalledOnce();
    expect(logAuditMock).toHaveBeenCalledOnce();
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj1",
        userId: "user1",
        action: "CREATED",
        entity: "TEST_RUN",
        entityId: "run1",
      })
    );
  });
});

