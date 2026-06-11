import { Search, UserPlus, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import UserActionMenu from "@/components/workspace/UserActionMenu";

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

// Deterministic vibrant avatar color from name
const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#e11d48", "#0284c7", "#9333ea",
];
function avatarColor(name: string | null) {
  if (!name) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default async function WorkspaceUsersPage() {
  const dbUsers = await prisma.user.findMany({
    include: { workspaceRole: true },
    orderBy: { createdAt: "asc" },
  });

  const roles = await prisma.workspaceRole.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const users = dbUsers.map((user) => ({
    id:         user.id,
    name:       user.name || user.email.split("@")[0],
    email:      user.email,
    initials:   getInitials(user.name),
    avatarBg:   avatarColor(user.name || user.email.split("@")[0]),
    isActive:   user.isActive,
    type:       user.role === "ADMIN" ? "Admin" : "Regular",
    role:       user.workspaceRole?.title || "Member",
    roleId:     user.workspaceRoleId,
    roleTitle:  user.workspaceRole?.title || "QA Engineer",
    lastAction: new Date(user.updatedAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }),
  }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Users</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {users.length}
          </span>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
          <UserPlus size={15} strokeWidth={2.5} />
          Invite member
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search members…"
            className="pl-8 pr-4 h-8 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 w-52 transition-all"
          />
        </div>
        <button className="h-8 px-3 text-indigo-500 text-xs font-semibold hover:bg-indigo-50 rounded-lg transition-all">
          + Filter
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Status</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Type</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32">Role</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">Job Title</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">Last Seen</th>
              <th className="pr-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}
                className={`border-b border-slate-100 last:border-0 transition-colors group
                  ${user.isActive ? "hover:bg-slate-50/70" : "opacity-50"}`}>

                {/* USER */}
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: user.avatarBg }}>
                      {user.initials}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold text-slate-800 ${!user.isActive && "line-through"}`}>
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-5 py-3.5 align-middle">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      Inactive
                    </span>
                  )}
                </td>

                {/* TYPE */}
                <td className="px-5 py-3.5 align-middle">
                  {user.type === "Admin" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                      Regular
                    </span>
                  )}
                </td>

                {/* ROLE */}
                <td className="px-5 py-3.5 align-middle">
                  <span className="text-sm text-slate-600">{user.role}</span>
                </td>

                {/* JOB TITLE */}
                <td className="px-5 py-3.5 align-middle">
                  <span className="text-sm text-slate-600">{user.roleTitle}</span>
                </td>

                {/* LAST SEEN */}
                <td className="px-5 py-3.5 align-middle">
                  <span className="text-sm text-slate-400">{user.lastAction}</span>
                </td>

                {/* ACTIONS */}
                <td className="pr-4 py-3.5 align-middle text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <UserActionMenu
                      userId={user.id}
                      isActive={user.isActive}
                      currentRoleId={user.roleId}
                      roles={roles}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
