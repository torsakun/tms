import { beforeEach, describe, expect, it, vi } from "vitest";

const testCaseMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  delete: vi.fn(),
}));

const projectMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

const logAuditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { testCase: testCaseMock, project: projectMock },
}));

vi.mock("next-auth/next", () => ({
  getServerSession: sessionMock.getServerSession,
}));

vi.mock("@/lib/audit-logger", () => ({ logAudit: logAuditMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { DELETE } from "@/app/api/projects/[code]/cases/[caseId]/route";

const routeParams = (code: string, caseId: string) => ({
  params: Promise.resolve({ code, caseId }),
});

const fakeProject = { id: "proj-fin", code: "FIN" };
const fakeCase = { id: "case-001", title: "Login test", projectId: "proj-fin" };
const fakeUser = { id: "user-001", email: "admin@example.com" };

describe("DELETE /api/projects/[code]/cases/[caseId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    logAuditMock.mockResolvedValue(undefined);
  });

  it("returns 401 when user is not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await DELETE(
      new Request("http://localhost/api/projects/FIN/cases/case-001", { method: "DELETE" }),
      routeParams("FIN", "case-001")
    );

    expect(res.status).toBe(401);
    expect(testCaseMock.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when project does not exist", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    projectMock.findFirst.mockResolvedValue(null);

    const res = await DELETE(
      new Request("http://localhost/api/projects/NOTEXIST/cases/case-001", { method: "DELETE" }),
      routeParams("NOTEXIST", "case-001")
    );

    expect(res.status).toBe(404);
    expect(testCaseMock.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when case belongs to a different project", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    testCaseMock.findUnique.mockResolvedValue({ ...fakeCase, projectId: "proj-other" });

    const res = await DELETE(
      new Request("http://localhost/api/projects/FIN/cases/case-001", { method: "DELETE" }),
      routeParams("FIN", "case-001")
    );

    expect(res.status).toBe(404);
    expect(testCaseMock.delete).not.toHaveBeenCalled();
  });

  it("deletes the case and returns success", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    testCaseMock.findUnique.mockResolvedValue(fakeCase);
    testCaseMock.delete.mockResolvedValue(fakeCase);

    const res = await DELETE(
      new Request("http://localhost/api/projects/FIN/cases/case-001", { method: "DELETE" }),
      routeParams("FIN", "case-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(testCaseMock.delete).toHaveBeenCalledWith({ where: { id: "case-001" } });
  });

  it("logs audit entry after successful deletion", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    testCaseMock.findUnique.mockResolvedValue(fakeCase);
    testCaseMock.delete.mockResolvedValue(fakeCase);

    await DELETE(
      new Request("http://localhost/api/projects/FIN/cases/case-001", { method: "DELETE" }),
      routeParams("FIN", "case-001")
    );

    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETED",
        entity: "TEST_CASE",
        entityId: "case-001",
      })
    );
  });
});
