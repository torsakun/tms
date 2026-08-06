import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const sharedStepMock = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }));
const projectRouteAuthMock = vi.hoisted(() => ({ requireProjectAccess: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, sharedStep: sharedStepMock } }));
vi.mock("@/lib/project-route-auth", () => projectRouteAuthMock);

import { GET, POST } from "@/app/api/projects/[code]/shared-steps/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

const makePostRequest = (body: object) =>
  new Request("http://localhost/api/projects/TEST/shared-steps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  projectRouteAuthMock.requireProjectAccess.mockResolvedValue({
    userId: "u1",
    userRole: "ADMIN",
  });
});

describe("GET /api/projects/[code]/shared-steps", () => {
  it("returns shared steps for the given project code", async () => {
    const steps = [
      { id: 1, title: "Login", action: "Click login", expectedResult: "Logged in", projectId: 10 },
    ];
    sharedStepMock.findMany.mockResolvedValue(steps);

    const req = new Request("http://localhost/api/projects/PROJ1/shared-steps");
    const res = await GET(req, routeParams("PROJ1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(sharedStepMock.findMany).toHaveBeenCalledWith({
      where: { project: { code: "PROJ1" } },
      orderBy: { createdAt: "desc" },
    });
    expect(data).toEqual(steps);
  });

  it("returns 500 when findMany throws", async () => {
    sharedStepMock.findMany.mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost/api/projects/PROJ1/shared-steps");
    const res = await GET(req, routeParams("PROJ1"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch shared steps" });
  });
});

describe("POST /api/projects/[code]/shared-steps", () => {
  it("returns 404 when project is not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const req = makePostRequest({ title: "Step", action: "Do thing", expectedResult: "Thing done" });
    const res = await POST(req, routeParams("MISSING"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Project not found" });
  });

  it("creates and returns a shared step with status 201", async () => {
    const project = { id: 42, code: "PROJ1" };
    const created = { id: 99, title: "Login step", action: "Click login", expectedResult: "Logged in", projectId: 42 };
    projectMock.findUnique.mockResolvedValue(project);
    sharedStepMock.create.mockResolvedValue(created);

    const req = makePostRequest({ title: "Login step", action: "Click login", expectedResult: "Logged in" });
    const res = await POST(req, routeParams("PROJ1"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(sharedStepMock.create).toHaveBeenCalledWith({
      data: {
        title: "Login step",
        action: "Click login",
        expectedResult: "Logged in",
        projectId: 42,
      },
    });
    expect(data).toEqual(created);
  });

  it("returns 500 when create throws", async () => {
    projectMock.findUnique.mockResolvedValue({ id: 42, code: "PROJ1" });
    sharedStepMock.create.mockRejectedValue(new Error("DB error"));

    const req = makePostRequest({ title: "Step", action: "Do thing", expectedResult: "Thing done" });
    const res = await POST(req, routeParams("PROJ1"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to create shared step" });
  });
});
