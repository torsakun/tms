import { Check, Search, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import UserActionMenu from "@/components/workspace/UserActionMenu";

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getColorForUser(name: string | null) {
  const colors = [
    "bg-emerald-600", "bg-primary", "bg-purple-600", "bg-rose-500",
    "bg-amber-600", "bg-indigo-600", "bg-pink-600", "bg-teal-600"
  ];
  if (!name) return colors[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
}

export default async function WorkspaceUsersPage() {
  const dbUsers = await prisma.user.findMany({
    include: { workspaceRole: true },
    orderBy: { createdAt: "asc" }
  });

  const roles = await prisma.workspaceRole.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" }
  });

  const users = dbUsers.map(user => ({
    id: user.id,
    name: user.name || user.email.split('@')[0],
    email: user.email,
    initials: getInitials(user.name || user.email.split('@')[0]),
    color: getColorForUser(user.name || user.email.split('@')[0]),
    isActive: user.isActive,
    type: user.role === "ADMIN" ? "Admin" : "Regular",
    role: user.workspaceRole?.title || "Member",
    roleId: user.workspaceRoleId,
    roleTitle: user.workspaceRole?.title || "QA Engineer",
    lastAction: new Date(user.updatedAt).toLocaleDateString()
  }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-blue-800 mb-6 tracking-tight flex items-center">Workspace</h1>

      {/* Toolbar */}
      <div className="flex items-center mb-6">
        <div className="relative w-64 mr-4">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search for team members"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <button className="text-primary text-sm font-medium hover:underline">
          Add filter
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl shadow-sm bg-white/60 backdrop-blur-md border border-indigo-100/50 hover:shadow-md hover:border-indigo-200 transition-all">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-900 to-blue-900 shadow-md">
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider rounded-tl-xl">User</th>
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider">Type</th>
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider">Role</th>
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider">Role Title</th>
              <th className="px-4 py-4 text-xs font-bold text-indigo-100 uppercase tracking-wider">Last Action</th>
              <th className="px-4 py-4 w-10 rounded-tr-xl"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className={`transition-colors ${user.isActive ? "hover:bg-blue-500/10" : "bg-blue-500/5 opacity-60"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 ${user.isActive ? user.color : 'bg-slate-300'} rounded flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                      {user.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${user.isActive ? 'text-text-main' : 'text-text-muted line-through'}`}>{user.name}</span>
                      <span className="text-xs text-text-muted">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <Minus size={16} className="text-text-muted" />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {user.type}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {user.role}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {user.roleTitle}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {user.lastAction}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserActionMenu 
                    userId={user.id} 
                    isActive={user.isActive} 
                    currentRoleId={user.roleId} 
                    roles={roles} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
