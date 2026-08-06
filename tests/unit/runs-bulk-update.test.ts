import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const prismaMock = vi.hoisted(() => ({
  project: { findFirst: vi.fn() },
  testCase: { deleteMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const requireProjectRoleMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));

import { DELETE } from "@/app/api/projects/[code]/cases/bulk/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/TEST/cases/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("DELETE /api/projects/[code]/cases/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the project is not found", async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    const res = await DELETE(makeRequest({ caseIds: ["id1"] }), makeParams("UNKNOWN"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });

  it("returns 401 when there is no authenticated session", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await DELETE(makeRequest({ caseIds: ["id1"] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when the user lacks the required project role", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await DELETE(makeRequest({ caseIds: ["id1"] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/Forbidden/);
  });

  it("returns 400 when caseIds is empty or missing", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    requireProjectRoleMock.mockResolvedValue(true);

    const res = await DELETE(makeRequest({ caseIds: [] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("No case IDs provided");
  });

  it("returns 400 when caseIds is not an array", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    requireProjectRoleMock.mockResolvedValue(true);

    const res = await DELETE(makeRequest({ caseIds: "id1" }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("No case IDs provided");
  });

  it("deletes cases and returns success with count for an authorized user", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    requireProjectRoleMock.mockResolvedValue(true);
    prismaMock.testCase.deleteMany.mockResolvedValue({ count: 2 });

    const res = await DELETE(makeRequest({ caseIds: ["id1", "id2"] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);
    expect(prismaMock.testCase.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["id1", "id2"] }, projectId: "proj1" },
    });
  });

  it("allows a global ADMIN to delete even without explicit project role", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } });
    requireProjectRoleMock.mockResolvedValue(false);
    prismaMock.testCase.deleteMany.mockResolvedValue({ count: 1 });

    const res = await DELETE(makeRequest({ caseIds: ["id1"] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 400 when deleteMany throws an unexpected error", async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: "proj1", code: "TEST" });
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    requireProjectRoleMock.mockResolvedValue(true);
    prismaMock.testCase.deleteMany.mockRejectedValue(new Error("DB connection lost"));

    const res = await DELETE(makeRequest({ caseIds: ["id1"] }), makeParams("TEST"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Failed to delete test cases");
  });
});
