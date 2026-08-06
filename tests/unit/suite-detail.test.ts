import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findFirst: vi.fn(), findUnique: vi.fn() }));
const testSuiteMock = vi.hoisted(() => ({
  update: vi.fn(),
  delete: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));
const testCaseMock = vi.hoisted(() => ({ updateMany: vi.fn(), deleteMany: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: projectMock,
    testSuite: testSuiteMock,
    testCase: testCaseMock,
  },
}));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { PATCH, DELETE } from "@/app/api/projects/[code]/suites/[suiteId]/route";

const routeParams = (code: string, suiteId: string) => ({
  params: Promise.resolve({ code, suiteId }),
});

const fakeProject = { id: "proj-1", code: "PROJ" };
const fakeUser = { user: { id: "user-1", role: "EDITOR" } };
const fakeSuite = { id: "suite-1", parentId: null };

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/projects/PROJ/suites/suite-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("PATCH /api/projects/[code]/suites/[suiteId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    sessionMock.getServerSession.mockResolvedValue(fakeUser);
    requireProjectRoleMock.mockResolvedValue(true);
    testSuiteMock.update.mockResolvedValue({ id: "suite-1", title: "New Title", description: "Desc" });
    testSuiteMock.findUnique.mockResolvedValue(fakeSuite);
    testSuiteMock.findMany.mockResolvedValue([]);
    testSuiteMock.delete.mockResolvedValue({});
    testCaseMock.updateMany.mockResolvedValue({});
    testCaseMock.deleteMany.mockResolvedValue({});
  });

  it("returns 404 when project is not found", async () => {
    projectMock.findFirst.mockResolvedValue(null);
    const req = makeRequest({ title: "New Title" });
    const res = await PATCH(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("returns 401 when session is missing", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);
    const req = makeRequest({ title: "New Title" });
    const res = await PATCH(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns 200 and updated suite", async () => {
    const req = makeRequest({ title: "New Title", description: "Desc" });
    const res = await PATCH(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe("New Title");
    expect(testSuiteMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "suite-1" },
        data: expect.objectContaining({ title: "New Title" }),
      })
    );
  });
});

describe("DELETE /api/projects/[code]/suites/[suiteId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    sessionMock.getServerSession.mockResolvedValue(fakeUser);
    requireProjectRoleMock.mockResolvedValue(true);
    testSuiteMock.findUnique.mockResolvedValue(fakeSuite);
    testSuiteMock.findMany.mockResolvedValue([]);
    testSuiteMock.delete.mockResolvedValue({});
    testCaseMock.updateMany.mockResolvedValue({});
    testCaseMock.deleteMany.mockResolvedValue({});
  });

  it("returns 401 when session is missing", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);
    const req = makeRequest({ retainCases: false });
    const res = await DELETE(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns 200 and moves cases to null when retainCases=true", async () => {
    const req = makeRequest({ retainCases: true });
    const res = await DELETE(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(testCaseMock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { suiteId: { in: ["suite-1"] } },
        data: { suiteId: null },
      })
    );
    expect(testCaseMock.deleteMany).not.toHaveBeenCalled();
    expect(testSuiteMock.delete).toHaveBeenCalledWith({ where: { id: "suite-1" } });
  });

  it("returns 200 and deletes cases when retainCases=false", async () => {
    const req = makeRequest({ retainCases: false });
    const res = await DELETE(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(testCaseMock.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { suiteId: { in: ["suite-1"] } },
      })
    );
    expect(testCaseMock.updateMany).not.toHaveBeenCalled();
    expect(testSuiteMock.delete).toHaveBeenCalledWith({ where: { id: "suite-1" } });
  });

  it("returns 403 when requireProjectRole returns false and user is not ADMIN", async () => {
    requireProjectRoleMock.mockResolvedValue(false);
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "VIEWER" } });
    const req = makeRequest({ retainCases: false });
    const res = await DELETE(req, routeParams("PROJ", "suite-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
  });
});
