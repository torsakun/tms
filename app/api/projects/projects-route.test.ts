import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { requireProjectAccess } from "@/lib/project-route-auth";
import { POST as createProject } from "@/app/api/projects/route";
import { POST as upsertMember } from "@/app/api/projects/[code]/members/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
    },
    projectMember: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/project-route-auth", () => ({
  requireProjectAccess: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireProjectAccess = vi.mocked(requireProjectAccess);
const projectFindUnique = prisma.project.findUnique as unknown as Mock;
const projectCreate = prisma.project.create as unknown as Mock;
const userFindMany = prisma.user.findMany as unknown as Mock;
const groupFindMany = prisma.group.findMany as unknown as Mock;
const projectMemberUpsert = prisma.projectMember.upsert as unknown as Mock;

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;
const req = (body: unknown) =>
  new Request("http://qmaster.test/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const memberReq = (body: unknown) =>
  new Request("http://qmaster.test/api/projects/PRO/members", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
const params = (code = "PRO") => ({ params: Promise.resolve({ code }) });

describe("projects API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireProjectAccess.mockResolvedValue({ userId: "admin-1", userRole: "USER" });
    mockedGetServerSession.mockResolvedValue({
      user: { id: "creator-1", email: "creator@example.com" },
    });
    projectFindUnique.mockResolvedValue(null);
    projectCreate.mockResolvedValue({ id: "project-1", code: "PRO", name: "Project" });
  });

  it("requires an authenticated creator before creating projects", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await createProject(req({ name: "Project", code: "PRO" }));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Unauthorized" });
    expect(projectCreate).not.toHaveBeenCalled();
  });

  it("normalizes project codes and creates the creator as ADMIN", async () => {
    const response = await createProject(req({ name: "Checkout", code: " pro-1 " }));

    expect(response.status).toBe(201);
    expect(projectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "PRO1",
          members: {
            create: [{ user: { connect: { id: "creator-1" } }, role: "ADMIN" }],
          },
        }),
      }),
    );
  });

  it("rejects duplicate project codes after normalization", async () => {
    projectFindUnique.mockResolvedValue({ id: "existing" });

    const response = await createProject(req({ name: "Project", code: "PRO" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Project code already exists" });
    expect(projectCreate).not.toHaveBeenCalled();
  });

  it("requires at least one selected group for group-only member access", async () => {
    const response = await createProject(
      req({ name: "Project", code: "PRO", memberAccess: "group", groupIds: [] }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Choose at least one group for group access" });
    expect(projectCreate).not.toHaveBeenCalled();
  });

  it("adds active users as VIEWERs when member access is all", async () => {
    userFindMany.mockResolvedValue([{ id: "creator-1" }, { id: "user-2" }]);

    const response = await createProject(
      req({ name: "Project", code: "PRO", memberAccess: "all" }),
    );

    expect(response.status).toBe(201);
    expect(projectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: {
            create: [
              { user: { connect: { id: "creator-1" } }, role: "ADMIN" },
              { user: { connect: { id: "user-2" } }, role: "VIEWER" },
            ],
          },
        }),
      }),
    );
  });

  it("rejects group access when one selected group is missing", async () => {
    groupFindMany.mockResolvedValue([{ id: "group-1", members: [] }]);

    const response = await createProject(
      req({ name: "Project", code: "PRO", memberAccess: "group", groupIds: ["group-1", "missing"] }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "One or more groups were not found" });
  });

  it("normalizes invalid project member roles to VIEWER", async () => {
    projectFindUnique.mockResolvedValue({ id: "project-1", code: "PRO" });
    projectMemberUpsert.mockResolvedValue({ id: "member-1", role: "VIEWER" });

    const response = await upsertMember(memberReq({ userId: "user-1", role: "OWNER" }), params("PRO"));

    expect(response.status).toBe(201);
    expect(projectMemberUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { role: "VIEWER" },
        create: { userId: "user-1", projectId: "project-1", role: "VIEWER" },
      }),
    );
  });
});
