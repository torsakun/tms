// Shared helper: who can manage the workspace (users, roles, invites, etc.)
// True for SystemRole ADMIN, or anyone whose workspace role grants "all"
// (e.g. the built-in Owner / Administrator roles).
export function canManageWorkspace(
  user:
    | {
        role?: string | null;
        workspaceRole?: { permissions?: unknown } | null;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const perms = user.workspaceRole?.permissions;
  if (Array.isArray(perms) && (perms.includes("all") || perms.includes("workspace-manage"))) {
    return true;
  }
  return false;
}
