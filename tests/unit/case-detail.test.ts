import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findFirst: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findUnique: vi.fn(), delete: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const logAuditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, testCase: testCaseMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-logger", () => ({ logAudit: logAuditMock }));

import { DELETE } from "@/app/api/projects/[code]/cases/[caseId]/route";

const routeParams = (code: string, caseId: string) => ({ params: Promise.resolve({ code, caseId }) });

describe("DELETE /api/projects/[code]/cases/[caseId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost"), routeParams("PROJ", "case-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when project is not found", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    projectMock.findFirst.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost"), routeParams("MISSING", "case-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Project not found");
  });

  it("returns 404 when test case is not found", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    projectMock.findFirst.mockResolvedValue({ id: "project-1", code: "PROJ" });
    testCaseMock.findUnique.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost"), routeParams("PROJ", "case-missing"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Test case not found");
  });

  it("returns 404 when test case projectId does not match project", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    projectMock.findFirst.mockResolvedValue({ id: "project-1", code: "PROJ" });
    testCaseMock.findUnique.mockResolvedValue({ id: "case-1", projectId: "project-other", title: "Some Case" });

    const res = await DELETE(new Request("http://localhost"), routeParams("PROJ", "case-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Test case not found");
  });

  it("deletes the test case, calls logAudit, and returns { success: true }", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    projectMock.findFirst.mockResolvedValue({ id: "project-1", code: "PROJ" });
    testCaseMock.findUnique.mockResolvedValue({ id: "case-1", projectId: "project-1", title: "Login Test" });
    testCaseMock.delete.mockResolvedValue({});
    logAuditMock.mockResolvedValue(undefined);

    const res = await DELETE(new Request("http://localhost"), routeParams("PROJ", "case-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(testCaseMock.delete).toHaveBeenCalledWith({ where: { id: "case-1" } });
    expect(logAuditMock).toHaveBeenCalledWith({
      projectId: "project-1",
      userId: "user-1",
      action: "DELETED",
      entity: "TEST_CASE",
      entityId: "case-1",
      details: "Deleted Test Case: Login Test",
    });
  });

  it("returns 500 when delete throws an error", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    projectMock.findFirst.mockResolvedValue({ id: "project-1", code: "PROJ" });
    testCaseMock.findUnique.mockResolvedValue({ id: "case-1", projectId: "project-1", title: "Login Test" });
    testCaseMock.delete.mockRejectedValue(new Error("DB connection lost"));

    const res = await DELETE(new Request("http://localhost"), routeParams("PROJ", "case-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("DB connection lost");
  });
});
