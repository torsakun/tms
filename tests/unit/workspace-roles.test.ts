import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceRoleMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceRole: workspaceRoleMock },
}));

const apiAuthMock = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  unauthorized: vi.fn(
    () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  ),
  forbidden: vi.fn(
    () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
  ),
}));

vi.mock("@/lib/api-auth", () => apiAuthMock);
vi.mock("@/lib/permissions", () => ({
  canManageRoles: vi.fn(() => true),
  canManageWorkspace: vi.fn(() => true),
  canManageUsers: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
}));

const adminActor = { id: "u1", role: "ADMIN", workspaceRole: { permissions: ["all"] } };

import { GET, PUT, DELETE } from "@/app/api/workspace/roles/[id]/route";

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function jsonRequest(method: string, id: string, body?: unknown) {
  return new Request(`http://localhost/api/workspace/roles/${id}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

const fakeRole = { id: "role-001", title: "Editor", description: null, isSystem: false, isDefault: false, permissions: [] };

describe("GET /api/workspace/roles/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns role when found", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(fakeRole);

    const res = await GET(new Request("http://localhost/api/workspace/roles/role-001"), routeParams("role-001"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.role.title).toBe("Editor");
  });

  it("returns 404 when role not found", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/workspace/roles/not-exist"), routeParams("not-exist"));

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/workspace/roles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiAuthMock.getSessionUser.mockResolvedValue(adminActor);
  });

  it("returns 404 when role not found", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(null);

    const res = await PUT(jsonRequest("PUT", "not-exist", { title: "New" }), routeParams("not-exist"));

    expect(res.status).toBe(404);
    expect(workspaceRoleMock.update).not.toHaveBeenCalled();
  });

  it("updates role and returns updated data", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(fakeRole);
    workspaceRoleMock.update.mockResolvedValue({ ...fakeRole, description: "Updated" });

    const res = await PUT(
      jsonRequest("PUT", "role-001", { title: "Editor", description: "Updated", isDefault: false, permissions: [] }),
      routeParams("role-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.role.description).toBe("Updated");
  });

  it("clears other default roles when setting isDefault true", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(fakeRole);
    workspaceRoleMock.update.mockResolvedValue({ ...fakeRole, isDefault: true });

    await PUT(
      jsonRequest("PUT", "role-001", { title: "Editor", isDefault: true, permissions: [] }),
      routeParams("role-001")
    );

    expect(workspaceRoleMock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDefault: true }, data: { isDefault: false } })
    );
  });
});

describe("DELETE /api/workspace/roles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiAuthMock.getSessionUser.mockResolvedValue(adminActor);
  });

  it("returns 404 when role not found", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/workspace/roles/not-exist", { method: "DELETE" }), routeParams("not-exist"));

    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to delete a system role", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue({ ...fakeRole, isSystem: true });

    const res = await DELETE(new Request("http://localhost/api/workspace/roles/role-001", { method: "DELETE" }), routeParams("role-001"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/System roles cannot be deleted/);
    expect(workspaceRoleMock.delete).not.toHaveBeenCalled();
  });

  it("returns 400 when trying to delete the default role", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue({ ...fakeRole, isDefault: true });

    const res = await DELETE(new Request("http://localhost/api/workspace/roles/role-001", { method: "DELETE" }), routeParams("role-001"));

    expect(res.status).toBe(400);
    expect(workspaceRoleMock.delete).not.toHaveBeenCalled();
  });

  it("deletes role and returns success", async () => {
    workspaceRoleMock.findUnique.mockResolvedValue(fakeRole);
    workspaceRoleMock.delete.mockResolvedValue(fakeRole);

    const res = await DELETE(new Request("http://localhost/api/workspace/roles/role-001", { method: "DELETE" }), routeParams("role-001"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
