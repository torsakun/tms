// Shared permission helpers for workspace access control.

type UserWithRole = {
  role?: string | null;
  workspaceRole?: { permissions?: unknown } | null;
} | null | undefined;

/** True if the user holds the given permission ID (or "all"). */
export function hasPermission(user: UserWithRole, permissionId: string): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true; // system admin always has everything
  const perms = user.workspaceRole?.permissions;
  if (!Array.isArray(perms)) return false;
  return perms.includes("all") || perms.includes(permissionId);
}

/** True for system admins or workspace roles that can manage the workspace. */
export function canManageWorkspace(user: UserWithRole): boolean {
  return hasPermission(user, "ws-update") || hasPermission(user, "workspace-manage");
}

/** True for users allowed to invite / activate / deactivate workspace members. */
export function canManageUsers(user: UserWithRole): boolean {
  return hasPermission(user, "ws-invite") || canManageWorkspace(user);
}

/** True for users allowed to view / manage workspace roles. */
export function canManageRoles(user: UserWithRole): boolean {
  return hasPermission(user, "ws-user-update") || canManageWorkspace(user);
}

/** True for users allowed to create/update projects. */
export function canManageProjects(user: UserWithRole): boolean {
  return hasPermission(user, "prj-create") || canManageWorkspace(user);
}
