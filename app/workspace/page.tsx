import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageWorkspace } from "@/lib/permissions";
import InviteMemberButton from "@/components/workspace/InviteMemberButton";
import UsersTable from "@/components/workspace/UsersTable";

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

// Deterministic vibrant avatar color from name
const AVATAR_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#e11d48",
  "#0284c7",
  "#9333ea",
];
function avatarColor(name: string | null) {
  if (!name) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default async function WorkspaceUsersPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id as string | undefined;

  const dbUsers = await prisma.user.findMany({
    include: { workspaceRole: true },
    orderBy: { createdAt: "asc" },
  });

  const currentUser = dbUsers.find((u) => u.id === currentUserId) || null;
  const isAdmin = canManageWorkspace(currentUser);

  const roles = await prisma.workspaceRole.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const users = dbUsers.map((user) => ({
    id: user.id,
    name: user.name || user.email.split("@")[0],
    email: user.email,
    initials: getInitials(user.name),
    avatarBg: avatarColor(user.name || user.email.split("@")[0]),
    isActive: user.isActive,
    isSysAdmin: user.role === "ADMIN",
    role: user.workspaceRole?.title || "Member",
    roleId: user.workspaceRoleId,
    lastAction: user.lastSeenAt
      ? new Date(user.lastSeenAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Never",
  }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            Users
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {users.length}
          </span>
        </div>
        {isAdmin && <InviteMemberButton />}
      </div>

      <UsersTable users={users} roles={roles} isAdmin={isAdmin} />
    </div>
  );
}
