import { beforeEach, describe, expect, it, vi } from "vitest";

const testPlanMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { testPlan: testPlanMock } }));

const projectAuthMock = vi.hoisted(() => ({
  requireProjectAccess: vi.fn(),
}));

vi.mock("@/lib/project-route-auth", () => projectAuthMock);

import { GET, PUT, DELETE } from "@/app/api/projects/[code]/plans/[planId]/route";

const routeParams = (code: string, planId: string) => ({
  params: Promise.resolve({ code, planId }),
});

const makeRequest = (body?: unknown) =>
  ({ json: () => Promise.resolve(body) }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  projectAuthMock.requireProjectAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
});

describe("GET /api/projects/[code]/plans/[planId]", () => {
  it("returns 404 when plan is not found", async () => {
    testPlanMock.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest(), routeParams("PROJ", "plan-1"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Plan not found" });
  });

  it("returns 200 with plan when found", async () => {
    const plan = { id: "plan-1", title: "Smoke Tests", testCases: [] };
    testPlanMock.findUnique.mockResolvedValue(plan);

    const res = await GET(makeRequest(), routeParams("PROJ", "plan-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(plan);
  });

  it("returns 500 on unexpected error", async () => {
    testPlanMock.findUnique.mockRejectedValue(new Error("db error"));

    const res = await GET(makeRequest(), routeParams("PROJ", "plan-1"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch test plan" });
  });
});

describe("PUT /api/projects/[code]/plans/[planId]", () => {
  it("returns 400 when title or caseIds are missing", async () => {
    const res = await PUT(
      makeRequest({ description: "no title or caseIds" }),
      routeParams("PROJ", "plan-1")
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Missing required fields" });
  });

  it("returns 200 with updated plan on success", async () => {
    const updated = { id: "plan-1", title: "Updated", description: "desc", testCases: [] };
    testPlanMock.update.mockResolvedValue(updated);

    const res = await PUT(
      makeRequest({ title: "Updated", description: "desc", caseIds: ["tc-1"] }),
      routeParams("PROJ", "plan-1")
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(updated);
    expect(testPlanMock.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: {
        title: "Updated",
        description: "desc",
        testCases: { set: [{ id: "tc-1" }] },
      },
    });
  });
});

describe("DELETE /api/projects/[code]/plans/[planId]", () => {
  it("returns 200 with success true when plan is deleted", async () => {
    testPlanMock.delete.mockResolvedValue({});

    const res = await DELETE(makeRequest(), routeParams("PROJ", "plan-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(testPlanMock.delete).toHaveBeenCalledWith({ where: { id: "plan-1" } });
  });

  it("returns 500 on unexpected error", async () => {
    testPlanMock.delete.mockRejectedValue(new Error("db error"));

    const res = await DELETE(makeRequest(), routeParams("PROJ", "plan-1"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to delete test plan" });
  });
});
