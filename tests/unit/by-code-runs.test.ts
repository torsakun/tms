import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const testRunMock = vi.hoisted(() => ({ create: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const testPlanMock = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: projectMock,
    testRun: testRunMock,
    testCase: testCaseMock,
    testPlan: testPlanMock,
  },
}));

import { GET, POST } from "@/app/api/projects/by-code/[code]/runs/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/projects/by-code/[code]/runs", () => {
  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/"), routeParams("MISSING"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Project not found" });
  });

  it("returns 200 with testRuns array when project exists", async () => {
    const testRuns = [
      { id: "run-1", title: "Run 1", results: [] },
      { id: "run-2", title: "Run 2", results: [] },
    ];
    projectMock.findUnique.mockResolvedValue({ id: "proj-1", code: "ABC", testRuns });

    const res = await GET(new Request("http://localhost/"), routeParams("ABC"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(testRuns);
  });

  it("returns 500 when DB throws an error", async () => {
    projectMock.findUnique.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(new Request("http://localhost/"), routeParams("ABC"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch runs" });
  });
});

describe("POST /api/projects/by-code/[code]/runs", () => {
  const makeRequest = (body: object = {}) =>
    new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), routeParams("MISSING"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Project not found" });
  });

  it("returns 400 when neither caseIds nor planId is provided", async () => {
    projectMock.findUnique.mockResolvedValue({ id: "proj-1", code: "ABC" });

    const res = await POST(makeRequest(), routeParams("ABC"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Provide caseIds or planId to create a test run" });
  });

  it("returns 201 and creates run with results for the provided caseIds", async () => {
    projectMock.findUnique.mockResolvedValue({ id: "proj-1", code: "ABC" });
    testCaseMock.findMany.mockResolvedValue([{ id: "tc-1" }, { id: "tc-2" }]);

    const createdRun = {
      id: "run-1",
      title: "My Run",
      description: "",
      projectId: "proj-1",
      results: [
        { id: "res-1", caseId: "tc-1", status: "IN_PROGRESS" },
        { id: "res-2", caseId: "tc-2", status: "IN_PROGRESS" },
      ],
    };
    testRunMock.create.mockResolvedValue(createdRun);

    const res = await POST(
      makeRequest({ title: "My Run", caseIds: ["tc-1", "tc-2"] }),
      routeParams("ABC"),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(createdRun);
    expect(testRunMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "My Run",
          projectId: "proj-1",
          results: {
            create: [
              { caseId: "tc-1", status: "IN_PROGRESS" },
              { caseId: "tc-2", status: "IN_PROGRESS" },
            ],
          },
        }),
      })
    );
  });
});
