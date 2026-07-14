import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const auditLogMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const sessionMock = vi.hoisted(() => ({ getServerSession: vi.fn() }));
const requireProjectRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { project: projectMock, auditLog: auditLogMock } }));
vi.mock("next-auth/next", () => ({ getServerSession: sessionMock.getServerSession }));
vi.mock("@/lib/project-auth", () => ({ requireProjectRole: requireProjectRoleMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET } from "@/app/api/projects/[code]/audit/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

describe("GET /api/projects/[code]/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const req = new Request("http://localhost/api/projects/PROJ/audit");
    const res = await GET(req, routeParams("PROJ"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when project is not found", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    projectMock.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/projects/NOTFOUND/audit");
    const res = await GET(req, routeParams("NOTFOUND"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Project not found" });
  });

  it("returns 403 when requireProjectRole returns false and user is not ADMIN", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    projectMock.findUnique.mockResolvedValue({ id: "proj-1", code: "PROJ" });
    requireProjectRoleMock.mockResolvedValue(false);

    const req = new Request("http://localhost/api/projects/PROJ/audit");
    const res = await GET(req, routeParams("PROJ"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(requireProjectRoleMock).toHaveBeenCalledWith("PROJ", "user-1", ["ADMIN", "EDITOR", "VIEWER"]);
  });

  it("returns 200 with logs array including user data when access is granted", async () => {
    const mockLogs = [
      {
        id: "log-1",
        action: "PROJECT_UPDATED",
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
        projectId: "proj-1",
        userId: "user-1",
        user: { id: "user-1", name: "Alice", email: "alice@example.com" },
      },
      {
        id: "log-2",
        action: "TASK_CREATED",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        projectId: "proj-1",
        userId: "user-1",
        user: { id: "user-1", name: "Alice", email: "alice@example.com" },
      },
    ];

    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    projectMock.findUnique.mockResolvedValue({ id: "proj-1", code: "PROJ" });
    requireProjectRoleMock.mockResolvedValue(true);
    auditLogMock.findMany.mockResolvedValue(mockLogs);

    const req = new Request("http://localhost/api/projects/PROJ/audit");
    const res = await GET(req, routeParams("PROJ"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("logs");
    expect(body.logs).toHaveLength(2);
    expect(body.logs[0]).toMatchObject({ id: "log-1", action: "PROJECT_UPDATED" });
    expect(body.logs[0].user).toEqual({ id: "user-1", name: "Alice", email: "alice@example.com" });
    expect(auditLogMock.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  it("returns 500 when the database throws an error", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    projectMock.findUnique.mockRejectedValue(new Error("DB connection failed"));

    const req = new Request("http://localhost/api/projects/PROJ/audit");
    const res = await GET(req, routeParams("PROJ"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});
