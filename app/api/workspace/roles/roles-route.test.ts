import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";
import { canManageRoles } from "@/lib/permissions";
import { POST as setDefaultRole } from "@/app/api/workspace/roles/[id]/default/route";
import { DELETE, PUT } from "@/app/api/workspace/roles/[id]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceRole: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getSessionUser: vi.fn(),
  unauthorized: () => NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => NextResponse.json({ error: "Forbidden" }, { status: 403 }),
}));

vi.mock("@/lib/permissions", () => ({
  canManageRoles: vi.fn(),
}));

const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedCanManageRoles = vi.mocked(canManageRoles);
const workspaceRoleFindUnique = prisma.workspaceRole.findUnique as unknown as Mock;
const workspaceRoleUpdateMany = prisma.workspaceRole.updateMany as unknown as Mock;
const workspaceRoleUpdate = prisma.workspaceRole.update as unknown as Mock;
const workspaceRoleDelete = prisma.workspaceRole.delete as unknown as Mock;
const prismaTransaction = prisma.$transaction as unknown as Mock;

const params = (id = "role-1") => ({ params: Promise.resolve({ id }) });
const json = async (response: Response) => response.json() as Promise<{ error?: string; success?: boolean }>;

describe("workspace roles API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSessionUser.mockResolvedValue({
      id: "admin-1",
      role: "USER",
      workspaceRole: { permissions: ["ws-user-update"] },
    });
    mockedCanManageRoles.mockReturnValue(true);
  });

  it("requires authentication before setting a default role", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const response = await setDefaultRole(new Request("http://test.local"), params());

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Unauthorized" });
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it("requires role-management permission before setting a default role", async () => {
    mockedCanManageRoles.mockReturnValue(false);

    const response = await setDefaultRole(new Request("http://test.local"), params());

    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "Forbidden" });
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when setting default for a missing role", async () => {
    workspaceRoleFindUnique.mockResolvedValue(null);

    const response = await setDefaultRole(new Request("http://test.local"), params("missing"));

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "Role not found" });
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it("sets exactly one default role inside a transaction", async () => {
    workspaceRoleFindUnique.mockResolvedValue({ id: "role-1" });
    workspaceRoleUpdateMany.mockReturnValue({});
    workspaceRoleUpdate.mockReturnValue({});
    prismaTransaction.mockResolvedValue([]);

    const response = await setDefaultRole(new Request("http://test.local"), params("role-1"));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true });
    expect(prismaTransaction).toHaveBeenCalledTimes(1);
  });

  it("blocks editing system roles through the API", async () => {
    workspaceRoleFindUnique.mockResolvedValue({
      id: "owner",
      isSystem: true,
    });

    const response = await PUT(
      new Request("http://test.local", {
        method: "PUT",
        body: JSON.stringify({ title: "Owner+", permissions: [] }),
      }),
      params("owner"),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "System roles cannot be edited" });
    expect(workspaceRoleUpdate).not.toHaveBeenCalled();
  });

  it("blocks deleting default roles", async () => {
    workspaceRoleFindUnique.mockResolvedValue({
      id: "member",
      isDefault: true,
      isSystem: false,
    });

    const response = await DELETE(new Request("http://test.local"), params("member"));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: "Cannot delete the default role. Set another role as default first.",
    });
    expect(workspaceRoleDelete).not.toHaveBeenCalled();
  });

  it("blocks deleting system roles", async () => {
    workspaceRoleFindUnique.mockResolvedValue({
      id: "owner",
      isDefault: false,
      isSystem: true,
    });

    const response = await DELETE(new Request("http://test.local"), params("owner"));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "System roles cannot be deleted" });
    expect(workspaceRoleDelete).not.toHaveBeenCalled();
  });
});
