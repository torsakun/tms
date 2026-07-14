import { beforeEach, describe, expect, it, vi } from "vitest";

const userMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const projectMemberMock = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: userMock, project: projectMock, projectMember: projectMemberMock },
}));

import { getProjectRole, requireProjectRole } from "@/lib/project-auth";

describe("getProjectRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns ADMIN when user is system ADMIN regardless of membership", async () => {
    userMock.findUnique.mockResolvedValue({ role: "ADMIN" });

    const role = await getProjectRole("FIN", "user-001");

    expect(role).toBe("ADMIN");
    expect(projectMock.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when project does not exist", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue(null);

    const role = await getProjectRole("NOTEXIST", "user-001");

    expect(role).toBeNull();
  });

  it("returns member role when user is an explicit project member", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue({ id: "proj-fin" });
    projectMemberMock.findUnique.mockResolvedValue({ role: "VIEWER" });

    const role = await getProjectRole("FIN", "user-001");

    expect(role).toBe("VIEWER");
  });

  it("defaults to VIEWER when user is not an explicit project member", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue({ id: "proj-fin" });
    projectMemberMock.findUnique.mockResolvedValue(null);

    const role = await getProjectRole("FIN", "user-001");

    expect(role).toBe("VIEWER");
  });
});

describe("requireProjectRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when user role is in allowed list", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue({ id: "proj-fin" });
    projectMemberMock.findUnique.mockResolvedValue({ role: "EDITOR" });

    const result = await requireProjectRole("FIN", "user-001", ["EDITOR", "ADMIN"]);

    expect(result).toBe(true);
  });

  it("returns false when user role is not in allowed list", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue({ id: "proj-fin" });
    projectMemberMock.findUnique.mockResolvedValue({ role: "VIEWER" });

    const result = await requireProjectRole("FIN", "user-001", ["EDITOR", "ADMIN"]);

    expect(result).toBe(false);
  });

  it("returns false when project does not exist", async () => {
    userMock.findUnique.mockResolvedValue({ role: "USER" });
    projectMock.findUnique.mockResolvedValue(null);

    const result = await requireProjectRole("NOTEXIST", "user-001", ["EDITOR"]);

    expect(result).toBe(false);
  });
});
