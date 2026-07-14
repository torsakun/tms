import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const milestoneMock = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }));
const projectAuthMock = vi.hoisted(() => ({ requireProjectAccess: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, milestone: milestoneMock } }));
vi.mock("@/lib/project-route-auth", () => projectAuthMock);

import { GET, POST } from "@/app/api/projects/[code]/milestones/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

describe("GET /api/projects/[code]/milestones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns milestones for the given project code", async () => {
    const milestones = [
      { id: "m1", title: "Milestone 1", projectId: "p1" },
      { id: "m2", title: "Milestone 2", projectId: "p1" },
    ];
    milestoneMock.findMany.mockResolvedValue(milestones);

    const req = new Request("http://localhost/api/projects/PROJ/milestones");
    const res = await GET(req, routeParams("PROJ"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(milestoneMock.findMany).toHaveBeenCalledWith({
      where: { project: { code: "PROJ" } },
      orderBy: { createdAt: "desc" },
      include: {
        testRuns: {
          include: {
            results: { select: { status: true } },
          },
        },
      },
    });
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("m1");
  });

  it("returns 500 when findMany throws", async () => {
    milestoneMock.findMany.mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost/api/projects/PROJ/milestones");
    const res = await GET(req, routeParams("PROJ"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch milestones" });
  });
});

describe("POST /api/projects/[code]/milestones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectAuthMock.requireProjectAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
  });

  it("returns 404 when project is not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/projects/UNKNOWN/milestones", {
      method: "POST",
      body: JSON.stringify({ title: "New Milestone", description: "desc" }),
    });
    const res = await POST(req, routeParams("UNKNOWN"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Project not found" });
  });

  it("returns 201 and creates milestone with dueDate when provided", async () => {
    const project = { id: "p1", code: "PROJ" };
    const dueDateStr = "2026-12-31";
    const milestone = {
      id: "m1",
      title: "Milestone With Date",
      description: "desc",
      dueDate: new Date(dueDateStr),
      projectId: "p1",
    };
    projectMock.findUnique.mockResolvedValue(project);
    milestoneMock.create.mockResolvedValue(milestone);

    const req = new Request("http://localhost/api/projects/PROJ/milestones", {
      method: "POST",
      body: JSON.stringify({ title: "Milestone With Date", description: "desc", dueDate: dueDateStr }),
    });
    const res = await POST(req, routeParams("PROJ"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(milestoneMock.create).toHaveBeenCalledWith({
      data: {
        title: "Milestone With Date",
        description: "desc",
        dueDate: new Date(dueDateStr),
        projectId: "p1",
      },
    });
    expect(data.id).toBe(milestone.id);
    expect(data.title).toBe(milestone.title);
  });

  it("returns 201 and creates milestone with null dueDate when not provided", async () => {
    const project = { id: "p1", code: "PROJ" };
    const milestone = {
      id: "m2",
      title: "Milestone No Date",
      description: "desc",
      dueDate: null,
      projectId: "p1",
    };
    projectMock.findUnique.mockResolvedValue(project);
    milestoneMock.create.mockResolvedValue(milestone);

    const req = new Request("http://localhost/api/projects/PROJ/milestones", {
      method: "POST",
      body: JSON.stringify({ title: "Milestone No Date", description: "desc" }),
    });
    const res = await POST(req, routeParams("PROJ"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(milestoneMock.create).toHaveBeenCalledWith({
      data: {
        title: "Milestone No Date",
        description: "desc",
        dueDate: null,
        projectId: "p1",
      },
    });
    expect(data.id).toBe(milestone.id);
    expect(data.dueDate).toBeNull();
  });

  it("returns 500 when create throws", async () => {
    const project = { id: "p1", code: "PROJ" };
    projectMock.findUnique.mockResolvedValue(project);
    milestoneMock.create.mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost/api/projects/PROJ/milestones", {
      method: "POST",
      body: JSON.stringify({ title: "Failing Milestone", description: "desc" }),
    });
    const res = await POST(req, routeParams("PROJ"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Failed to create milestone" });
  });
});
