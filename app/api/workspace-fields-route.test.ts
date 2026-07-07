import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";
import { GET, POST } from "@/app/api/workspace/fields/route";
import { DELETE, PUT } from "@/app/api/workspace/fields/[id]/route";
import { POST as toggleField } from "@/app/api/workspace/fields/[id]/toggle/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customField: { findMany: vi.fn(), create: vi.fn(), upsert: vi.fn(), update: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    workspaceSetting: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@/lib/api-auth", () => ({
  getSessionUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Forbidden" }, { status: 403 }),
}));
vi.mock("@/lib/permissions", () => ({ canManageWorkspace: vi.fn() }));

const mockedUser = vi.mocked(getSessionUser);
const mockedCanManage = vi.mocked(canManageWorkspace);
const fieldFindMany = prisma.customField.findMany as unknown as Mock;
const fieldCreate = prisma.customField.create as unknown as Mock;
const fieldUpsert = prisma.customField.upsert as unknown as Mock;
const fieldUpdate = prisma.customField.update as unknown as Mock;
const fieldFindUnique = prisma.customField.findUnique as unknown as Mock;
const fieldDelete = prisma.customField.delete as unknown as Mock;
const settingFindUnique = prisma.workspaceSetting.findUnique as unknown as Mock;
const settingUpsert = prisma.workspaceSetting.upsert as unknown as Mock;

const req = (body?: unknown, method = "POST") =>
  new Request("http://qmaster.test/api/workspace/fields", { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }) as never;
const params = (id = "field-1") => ({ params: Promise.resolve({ id }) });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("workspace fields routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedUser.mockResolvedValue({ id: "admin-1", role: "ADMIN", workspaceRole: null });
    mockedCanManage.mockReturnValue(true);
    fieldFindMany.mockResolvedValue([{ id: "field-1", name: "Browser", entity: "TestCase", type: "TEXT", isRequired: false, isSystem: false, isGlobal: true, projects: [], order: 1, options: null }]);
    settingFindUnique.mockResolvedValue({ value: JSON.stringify(["sys-type"]) });
    fieldCreate.mockResolvedValue({ id: "field-1" });
    fieldUpsert.mockResolvedValue({ id: "sys-priority" });
    fieldUpdate.mockResolvedValue({ id: "field-1" });
    fieldFindUnique.mockResolvedValue({ id: "field-1", isGlobal: false, projects: [] });
    fieldDelete.mockResolvedValue({});
    settingUpsert.mockResolvedValue({});
  });

  it("combines system defaults, custom fields, and disabled field state", async () => {
    const response = await GET(req(undefined, "GET"));
    expect(response.status).toBe(200);
    const fields = await response.json();
    expect(fields).toEqual(expect.arrayContaining([expect.objectContaining({ id: "sys-type", isActive: false }), expect.objectContaining({ id: "field-1", projects: "All projects" })]));
  });

  it("requires permission and validates custom field creation", async () => {
    mockedCanManage.mockReturnValue(false);
    const forbidden = await POST(req({ name: "Browser", type: "TEXT" }));
    mockedCanManage.mockReturnValue(true);
    const invalid = await POST(req({ name: "", type: "" }));
    expect(forbidden.status).toBe(403);
    expect(invalid.status).toBe(400);
  });

  it("creates project-scoped custom fields", async () => {
    const response = await POST(req({ name: "Browser", type: "SELECT", options: ["Chrome"], isGlobal: false, projectIds: ["project-1"] }));
    expect(response.status).toBe(200);
    expect(fieldCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isGlobal: false,
        projects: { connect: [{ id: "project-1" }] },
      }),
    });
  });

  it("upserts system field overrides and blocks deleting assigned fields", async () => {
    const put = await PUT(req({ name: "Priority+", isRequired: true, order: 2 }, "PUT"), params("sys-priority"));
    fieldFindUnique.mockResolvedValue({ id: "field-1", isGlobal: true, projects: [] });
    const del = await DELETE(req(undefined, "DELETE"), params("field-1"));
    expect(put.status).toBe(200);
    expect(fieldUpsert).toHaveBeenCalled();
    expect(del.status).toBe(400);
  });

  it("toggles field disabled state in workspace settings", async () => {
    const response = await toggleField(req(undefined, "POST"), params("sys-type"));
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true, isActive: true });
    expect(settingUpsert).toHaveBeenCalledWith(expect.objectContaining({ update: { value: "[]" } }));
  });
});
