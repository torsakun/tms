import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getProjectRole, requireProjectRole } from "@/lib/project-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

const userFindUnique = prisma.user.findUnique as unknown as Mock;
const projectFindUnique = prisma.project.findUnique as unknown as Mock;
const projectMemberFindUnique = prisma.projectMember.findUnique as unknown as Mock;

describe("project authorization helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ADMIN for system admins without checking project membership", async () => {
    userFindUnique.mockResolvedValue({ role: "ADMIN" });

    await expect(getProjectRole("PRO", "user-1")).resolves.toBe("ADMIN");

    expect(projectFindUnique).not.toHaveBeenCalled();
    expect(projectMemberFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when the project code does not exist", async () => {
    userFindUnique.mockResolvedValue({ role: "USER" });
    projectFindUnique.mockResolvedValue(null);

    await expect(getProjectRole("MISSING", "user-1")).resolves.toBeNull();
  });

  it("returns the assigned project member role", async () => {
    userFindUnique.mockResolvedValue({ role: "USER" });
    projectFindUnique.mockResolvedValue({ id: "project-1" });
    projectMemberFindUnique.mockResolvedValue({ role: "EDITOR" });

    await expect(getProjectRole("PRO", "user-1")).resolves.toBe("EDITOR");
  });

  it("falls back to VIEWER for non-members of an existing project", async () => {
    userFindUnique.mockResolvedValue({ role: "USER" });
    projectFindUnique.mockResolvedValue({ id: "project-1" });
    projectMemberFindUnique.mockResolvedValue(null);

    await expect(getProjectRole("PRO", "user-1")).resolves.toBe("VIEWER");
  });

  it("checks required roles against the resolved role", async () => {
    userFindUnique.mockResolvedValue({ role: "USER" });
    projectFindUnique.mockResolvedValue({ id: "project-1" });
    projectMemberFindUnique.mockResolvedValue({ role: "EDITOR" });

    await expect(requireProjectRole("PRO", "user-1", ["ADMIN", "EDITOR"])).resolves.toBe(true);
    await expect(requireProjectRole("PRO", "user-1", ["ADMIN"])).resolves.toBe(false);
  });
});
