import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceRoleMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceRole: workspaceRoleMock },
}));

const apiAuthMock = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  unauthorized: vi.fn(
    () =>
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  ),
  forbidden: vi.fn(
    () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
  ),
}));

vi.mock("@/lib/api-auth", () => apiAuthMock);

import { GET, POST } from "@/app/api/workspace/roles/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/workspace/roles", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const fakeRoles = [
  { id: "r1", title: "Owner", isSystem: true, isDefault: false, permissions: ["all"], _count: { users: 2 } },
  { id: "r2", title: "Member", isSystem: true, isDefault: true, permissions: [], _count: { users: 5 } },
];

describe("GET /api/workspace/roles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns roles without creating when system roles already exist", async () => {
    // Every system role def already exists (non-qase description => no update/create)
    workspaceRoleMock.findFirst.mockResolvedValue({
      id: "existing",
      description: "already here",
    });
    workspaceRoleMock.findMany.mockResolvedValue(fakeRoles);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.roles).toHaveLength(2);
    expect(workspaceRoleMock.create).not.toHaveBeenCalled();
  });

  it("seeds system roles when none exist, then returns them", async () => {
    workspaceRoleMock.findFirst.mockResolvedValue(null);
    workspaceRoleMock.create.mockResolvedValue({ id: "seeded" });
    workspaceRoleMock.findMany.mockResolvedValue(fakeRoles);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(workspaceRoleMock.create).toHaveBeenCalled();
    expect(body.roles).toHaveLength(2);
  });

  it("returns 500 when DB throws", async () => {
    workspaceRoleMock.findFirst.mockRejectedValue(new Error("DB error"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});

describe("POST /api/workspace/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated actor allowed to manage roles ("all" permission).
    apiAuthMock.getSessionUser.mockResolvedValue({
      id: "u1",
      role: "ADMIN",
      workspaceRole: { permissions: ["all"] },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    apiAuthMock.getSessionUser.mockResolvedValue(null);

    const res = await POST(jsonRequest({ title: "QA Lead" }));

    expect(res.status).toBe(401);
    expect(workspaceRoleMock.create).not.toHaveBeenCalled();
  });

  it("returns 403 when actor lacks role-management permission", async () => {
    apiAuthMock.getSessionUser.mockResolvedValue({
      id: "u2",
      role: "MEMBER",
      workspaceRole: { permissions: [] },
    });

    const res = await POST(jsonRequest({ title: "QA Lead" }));

    expect(res.status).toBe(403);
    expect(workspaceRoleMock.create).not.toHaveBeenCalled();
  });

  it("returns 400 when title is missing", async () => {
    const res = await POST(jsonRequest({ description: "no title" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Title is required/);
    expect(workspaceRoleMock.create).not.toHaveBeenCalled();
  });

  it("creates role and returns 201", async () => {
    workspaceRoleMock.create.mockResolvedValue({ id: "r3", title: "QA Lead", isSystem: false });

    const res = await POST(jsonRequest({ title: "QA Lead", permissions: ["tc-create"] }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.role.title).toBe("QA Lead");
    expect(workspaceRoleMock.updateMany).not.toHaveBeenCalled();
  });

  it("clears old default before setting new one when isDefault=true", async () => {
    workspaceRoleMock.updateMany.mockResolvedValue({ count: 1 });
    workspaceRoleMock.create.mockResolvedValue({ id: "r4", title: "New Default", isDefault: true, isSystem: false });

    const res = await POST(jsonRequest({ title: "New Default", isDefault: true }));

    expect(res.status).toBe(201);
    expect(workspaceRoleMock.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  });

  it("returns 500 when DB throws during create", async () => {
    workspaceRoleMock.create.mockRejectedValue(new Error("DB error"));

    const res = await POST(jsonRequest({ title: "Broken Role" }));

    expect(res.status).toBe(500);
  });
});
