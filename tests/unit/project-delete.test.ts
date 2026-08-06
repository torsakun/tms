import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  delete: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-logger", () => ({ logAudit: vi.fn() }));

import { DELETE } from "@/app/api/projects/[code]/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });
const fakeProject = { id: "proj-fin", code: "FIN" };

describe("DELETE /api/projects/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("returns 404 when project is not found", async () => {
    projectMock.findFirst.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/projects/NOTEXIST", { method: "DELETE" }), routeParams("NOTEXIST"));

    expect(res.status).toBe(404);
    expect(projectMock.delete).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/projects/FIN", { method: "DELETE" }), routeParams("FIN"));

    expect(res.status).toBe(401);
    expect(projectMock.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when caller lacks admin access", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "u2", role: "USER" } });
    requireProjectRoleMock.mockResolvedValue(false);

    const res = await DELETE(new Request("http://localhost/api/projects/FIN", { method: "DELETE" }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/Admin access required/);
    expect(projectMock.delete).not.toHaveBeenCalled();
  });

  it("allows a system ADMIN even without an explicit project role", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    requireProjectRoleMock.mockResolvedValue(false);
    projectMock.delete.mockResolvedValue(fakeProject);

    const res = await DELETE(new Request("http://localhost/api/projects/FIN", { method: "DELETE" }), routeParams("FIN"));

    expect(res.status).toBe(200);
    expect(projectMock.delete).toHaveBeenCalledWith({ where: { id: "proj-fin" } });
  });

  it("deletes the project and returns its code on success", async () => {
    projectMock.delete.mockResolvedValue(fakeProject);

    const res = await DELETE(new Request("http://localhost/api/projects/FIN", { method: "DELETE" }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, deleted: "FIN" });
    expect(projectMock.delete).toHaveBeenCalledWith({ where: { id: "proj-fin" } });
  });

  it("resolves the project by id as well as by code", async () => {
    await DELETE(new Request("http://localhost/api/projects/proj-fin", { method: "DELETE" }), routeParams("proj-fin"));

    expect(projectMock.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ id: "proj-fin" }, { code: "proj-fin" }] },
    });
  });

  it("returns 500 when the database throws", async () => {
    projectMock.delete.mockRejectedValue(new Error("DB error"));

    const res = await DELETE(new Request("http://localhost/api/projects/FIN", { method: "DELETE" }), routeParams("FIN"));

    expect(res.status).toBe(500);
  });
});
