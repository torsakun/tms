import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn()
}));

const authMock = vi.hoisted(() => ({
  getServerSession: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: projectMock
  }
}));

vi.mock("next-auth/next", () => ({
  getServerSession: authMock.getServerSession
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

import { GET, POST } from "@/app/api/projects/route";

const CREATOR_ID = "user-1";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

describe("projects API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getServerSession.mockResolvedValue({ user: { id: CREATOR_ID } });
  });

  it("rejects project creation when name or code is missing", async () => {
    const response = await POST(jsonRequest({ name: "Checkout Revamp" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Name and Code are required" });
    expect(projectMock.create).not.toHaveBeenCalled();
  });

  it("normalizes the project code before creating a project", async () => {
    projectMock.findUnique.mockResolvedValue(null);
    projectMock.create.mockResolvedValue({
      id: "project-1",
      name: "Checkout Revamp",
      code: "CHECKOUT01",
      description: "Payment checkout test project"
    });

    const response = await POST(jsonRequest({
      name: "Checkout Revamp",
      code: "checkout-01",
      description: "Payment checkout test project"
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(projectMock.findUnique).toHaveBeenCalledWith({ where: { code: "CHECKOUT01" } });
    expect(projectMock.create).toHaveBeenCalledWith({
      data: {
        name: "Checkout Revamp",
        code: "CHECKOUT01",
        description: "Payment checkout test project",
        accessType: "PUBLIC",
        groups: undefined,
        members: {
          create: [
            { user: { connect: { id: CREATOR_ID } }, role: "ADMIN" }
          ]
        }
      }
    });
    expect(body.code).toBe("CHECKOUT01");
  });

  it("rejects duplicate project codes", async () => {
    projectMock.findUnique.mockResolvedValue({ id: "project-1", code: "CRM" });

    const response = await POST(jsonRequest({ name: "CRM", code: "crm" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Project code already exists" });
    expect(projectMock.create).not.toHaveBeenCalled();
  });

  it("lists projects with only id, name, and code", async () => {
    projectMock.findMany.mockResolvedValue([
      { id: "project-2", name: "Billing", code: "BILL" },
      { id: "project-1", name: "CRM", code: "CRM" }
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(projectMock.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true
      }
    });
    expect(body).toEqual([
      { id: "project-2", name: "Billing", code: "BILL" },
      { id: "project-1", name: "CRM", code: "CRM" }
    ]);
  });
});
