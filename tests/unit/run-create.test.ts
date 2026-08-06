import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findFirst: vi.fn() }));
const testRunMock = vi.hoisted(() => ({ create: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());
const logAuditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { project: projectMock, testRun: testRunMock, testCase: testCaseMock },
}));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/audit-logger", () => ({ logAudit: logAuditMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { POST } from "@/app/api/projects/[code]/runs/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

function jsonRequest(code: string, body: unknown) {
  return new Request(`http://localhost/api/projects/${code}/runs`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const fakeProject = { id: "proj-fin", code: "FIN" };
const fakeUser = { id: "user-001", email: "admin@example.com", role: "ADMIN" };
const fakeRun = { id: "run-001", title: "Sprint 1", results: [] };

describe("POST /api/projects/[code]/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    requireProjectRoleMock.mockResolvedValue(true);
    logAuditMock.mockResolvedValue(undefined);
    testCaseMock.findMany.mockImplementation(async ({ where }) => {
      const ids: string[] = where?.id?.in ?? [];
      return ids.map((id) => ({ id }));
    });
  });

  it("returns 401 when not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await POST(jsonRequest("FIN", { title: "Sprint 1", caseIds: ["c1"] }), routeParams("FIN"));

    expect(res.status).toBe(401);
    expect(testRunMock.create).not.toHaveBeenCalled();
  });

  it("returns 403 when user lacks role", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { ...fakeUser, role: "USER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await POST(jsonRequest("FIN", { title: "Sprint 1", caseIds: ["c1"] }), routeParams("FIN"));

    expect(res.status).toBe(403);
    expect(testRunMock.create).not.toHaveBeenCalled();
  });

  it("returns 400 when caseIds is empty", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });

    const res = await POST(jsonRequest("FIN", { title: "Sprint 1", caseIds: [] }), routeParams("FIN"));

    expect(res.status).toBe(400);
    expect(testRunMock.create).not.toHaveBeenCalled();
  });

  it("creates run with IN_PROGRESS results and returns 201", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    testRunMock.create.mockResolvedValue(fakeRun);

    const res = await POST(
      jsonRequest("FIN", { title: "Sprint 1", caseIds: ["c1", "c2"] }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBe("run-001");
    expect(testRunMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          results: {
            create: [
              { caseId: "c1", status: "IN_PROGRESS" },
              { caseId: "c2", status: "IN_PROGRESS" },
            ],
          },
        }),
      })
    );
  });

  it("logs audit after run is created", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    testRunMock.create.mockResolvedValue(fakeRun);

    await POST(jsonRequest("FIN", { title: "Sprint 1", caseIds: ["c1"] }), routeParams("FIN"));

    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATED", entity: "TEST_RUN" })
    );
  });

  it("returns 404 when project not found", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.findFirst.mockResolvedValue(null);

    const res = await POST(jsonRequest("NOTEXIST", { title: "Sprint 1", caseIds: ["c1"] }), routeParams("NOTEXIST"));

    expect(res.status).toBe(404);
  });
});
