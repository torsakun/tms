import { beforeEach, describe, expect, it, vi } from "vitest";

const runMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const runResultMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { testRun: runMock, testRunResult: runResultMock },
}));

const routeAuthMock = vi.hoisted(() => ({
  requireRunAccess: vi.fn(),
}));

vi.mock("@/lib/project-route-auth", () => routeAuthMock);

import { GET, PUT, DELETE } from "@/app/api/projects/[code]/runs/[runId]/route";

const routeParams = (code: string, runId: string) => ({
  params: Promise.resolve({ code, runId }),
});

const fakeRun = { id: "run-001", title: "Sprint 1", projectId: "proj-fin", results: [] };

describe("GET /api/projects/[code]/runs/[runId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns run with results when found", async () => {
    runMock.findUnique.mockResolvedValue(fakeRun);

    const res = await GET(
      new Request("http://localhost/api/projects/FIN/runs/run-001"),
      routeParams("FIN", "run-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("run-001");
  });

  it("returns 404 when run does not exist", async () => {
    runMock.findUnique.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/projects/FIN/runs/not-exist"),
      routeParams("FIN", "not-exist")
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/projects/[code]/runs/[runId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeAuthMock.requireRunAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
    runMock.update.mockResolvedValue(fakeRun);
    runResultMock.findMany.mockResolvedValue([]);
    runResultMock.createMany.mockResolvedValue({ count: 1 });
  });

  it("returns 400 when title is missing", async () => {
    const res = await PUT(
      new Request("http://localhost/api/projects/FIN/runs/run-001", {
        method: "PUT",
        body: JSON.stringify({ caseIds: ["case-001"] }),
        headers: { "content-type": "application/json" },
      }),
      routeParams("FIN", "run-001")
    );

    expect(res.status).toBe(400);
    expect(runMock.update).not.toHaveBeenCalled();
  });

  it("updates run and adds new cases", async () => {
    const res = await PUT(
      new Request("http://localhost/api/projects/FIN/runs/run-001", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Run", caseIds: ["case-001", "case-002"] }),
        headers: { "content-type": "application/json" },
      }),
      routeParams("FIN", "run-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(runResultMock.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ caseId: "case-001", status: "IN_PROGRESS" }),
        ]),
      })
    );
  });
});

describe("DELETE /api/projects/[code]/runs/[runId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeAuthMock.requireRunAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
  });

  it("deletes run and returns success", async () => {
    runMock.delete.mockResolvedValue(fakeRun);

    const res = await DELETE(
      new Request("http://localhost/api/projects/FIN/runs/run-001", { method: "DELETE" }),
      routeParams("FIN", "run-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(runMock.delete).toHaveBeenCalledWith({ where: { id: "run-001" } });
  });
});
