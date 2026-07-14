import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  project: {
    findFirst: vi.fn(),
    create: vi.fn()
  },
  testSuite: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

const authMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  requireProjectRole: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: dbMock
}));

vi.mock("next-auth/next", () => ({
  getServerSession: authMock.getServerSession
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

vi.mock("@/lib/project-auth", () => ({
  requireProjectRole: authMock.requireProjectRole
}));

import { GET, POST } from "@/app/api/projects/[code]/suites/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects/ECO/suites", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

function params(code = "ECO") {
  return { params: Promise.resolve({ code }) };
}

describe("project suites API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects suite creation when the user is not authenticated", async () => {
    dbMock.project.findFirst.mockResolvedValue({ id: "project-1", code: "ECO" });
    authMock.getServerSession.mockResolvedValue(null);

    const response = await POST(jsonRequest({ title: "Checkout" }), params());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(dbMock.testSuite.create).not.toHaveBeenCalled();
  });

  it("creates a suite under an existing project when the user has access", async () => {
    dbMock.project.findFirst.mockResolvedValue({ id: "project-1", code: "ECO" });
    authMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    authMock.requireProjectRole.mockResolvedValue(true);
    dbMock.testSuite.create.mockResolvedValue({
      id: "suite-1",
      title: "Checkout",
      description: "Checkout flows",
      parentId: null,
      projectId: "project-1"
    });

    const response = await POST(jsonRequest({
      title: "Checkout",
      description: "Checkout flows",
      parentId: null
    }), params());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(authMock.requireProjectRole).toHaveBeenCalledWith("ECO", "user-1", ["EDITOR", "ADMIN"]);
    expect(dbMock.testSuite.create).toHaveBeenCalledWith({
      data: {
        title: "Checkout",
        description: "Checkout flows",
        parentId: null,
        projectId: "project-1"
      }
    });
    expect(body.id).toBe("suite-1");
  });

  it("auto-creates the project before creating a suite when the project does not exist", async () => {
    dbMock.project.findFirst.mockResolvedValue(null);
    dbMock.project.create.mockResolvedValue({ id: "project-2", code: "NEW", name: "NEW Project" });
    authMock.getServerSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    authMock.requireProjectRole.mockResolvedValue(false);
    dbMock.testSuite.create.mockResolvedValue({ id: "suite-2", title: "Core", projectId: "project-2" });

    const response = await POST(jsonRequest({ title: "Core" }), params("NEW"));

    expect(response.status).toBe(201);
    expect(dbMock.project.create).toHaveBeenCalledWith({
      data: {
        code: "NEW",
        name: "NEW Project"
      }
    });
    expect(dbMock.testSuite.create).toHaveBeenCalledWith({
      data: {
        title: "Core",
        description: undefined,
        parentId: undefined,
        projectId: "project-2"
      }
    });
  });

  it("lists suites for an existing project ordered by position", async () => {
    dbMock.project.findFirst.mockResolvedValue({ id: "project-1", code: "ECO" });
    dbMock.testSuite.findMany.mockResolvedValue([
      { id: "suite-1", title: "Checkout", position: 0 },
      { id: "suite-2", title: "Payment", position: 1 }
    ]);

    const response = await GET(new Request("http://localhost/api/projects/ECO/suites"), params());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(dbMock.testSuite.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: { position: "asc" }
    });
    expect(body).toEqual([
      { id: "suite-1", title: "Checkout", position: 0 },
      { id: "suite-2", title: "Payment", position: 1 }
    ]);
  });

  it("returns an empty list when listing suites for an unknown project", async () => {
    dbMock.project.findFirst.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/projects/UNKNOWN/suites"), params("UNKNOWN"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
    expect(dbMock.testSuite.findMany).not.toHaveBeenCalled();
  });
});
