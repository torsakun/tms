import { describe, expect, it } from "vitest";
import {
  canManageProjects,
  canManageRoles,
  canManageUsers,
  canManageWorkspace,
  hasPermission,
} from "@/lib/permissions";

describe("workspace permission helpers", () => {
  it("denies missing users and malformed permission payloads", () => {
    expect(hasPermission(null, "ws-update")).toBe(false);
    expect(hasPermission(undefined, "ws-update")).toBe(false);
    expect(
      hasPermission({ role: "USER", workspaceRole: { permissions: "all" } }, "ws-update"),
    ).toBe(false);
  });

  it("grants every permission to system admins", () => {
    expect(hasPermission({ role: "ADMIN", workspaceRole: null }, "anything")).toBe(true);
    expect(canManageWorkspace({ role: "ADMIN", workspaceRole: null })).toBe(true);
    expect(canManageRoles({ role: "ADMIN", workspaceRole: null })).toBe(true);
  });

  it("honors explicit permission ids and the all wildcard", () => {
    const roleUser = {
      role: "USER",
      workspaceRole: { permissions: ["ws-invite", "prj-create"] },
    };

    expect(hasPermission(roleUser, "ws-invite")).toBe(true);
    expect(hasPermission(roleUser, "ws-update")).toBe(false);
    expect(hasPermission({ role: "USER", workspaceRole: { permissions: ["all"] } }, "ws-update")).toBe(true);
  });

  it("maps high-level capability helpers to the expected permission ids", () => {
    expect(
      canManageWorkspace({ role: "USER", workspaceRole: { permissions: ["ws-update"] } }),
    ).toBe(true);
    expect(
      canManageUsers({ role: "USER", workspaceRole: { permissions: ["ws-invite"] } }),
    ).toBe(true);
    expect(
      canManageRoles({ role: "USER", workspaceRole: { permissions: ["ws-user-update"] } }),
    ).toBe(true);
    expect(
      canManageProjects({ role: "USER", workspaceRole: { permissions: ["prj-create"] } }),
    ).toBe(true);
  });
});
