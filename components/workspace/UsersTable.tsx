"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Users as UsersIcon } from "lucide-react";
import UserActionMenu from "@/components/workspace/UserActionMenu";

interface UserRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  isActive: boolean;
  isSysAdmin: boolean;
  role: string;
  roleId: string | null;
  lastAction: string;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function UsersTable({ users, roles, isAdmin = false }: { users: UserRow[]; roles: { id: string; title: string }[]; isAdmin?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [openMenu, setOpenMenu] = useState<"status" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || (status === "ACTIVE" ? u.isActive : !u.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [users, search, status]);

  const STATUS_LABEL: Record<StatusFilter, string> = { ALL: "All", ACTIVE: "Active", INACTIVE: "Inactive" };

  const chip = (active: boolean) =>
    `h-8 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
      active ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
    }`;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4" ref={filterRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-8 pr-4 h-8 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 w-52 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu === "status" ? null : "status")} className={chip(status !== "ALL")}>
            Status: {STATUS_LABEL[status]} <ChevronDown size={12} />
          </button>
          {openMenu === "status" && (
            <div className="absolute left-0 mt-1 w-40 bg-white rounded-xl py-1 z-30 overflow-hidden" style={{ border: "1px solid #f1f3f9", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
              {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map((s) => (
                <button key={s} onClick={() => { setStatus(s); setOpenMenu(null); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between ${status === s ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>
                  {STATUS_LABEL[s]} {status === s && <Check size={13} strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {(search || status !== "ALL") && (
          <span className="text-xs text-slate-400 ml-1">{filtered.length} of {users.length}</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-visible bg-white border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">Status</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-44">Role</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">Last Seen</th>
              <th className="pr-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}
                className={`border-b border-slate-100 last:border-0 transition-colors group ${user.isActive ? "hover:bg-slate-50/70" : "opacity-60"}`}>
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: user.avatarBg }}>
                      {user.initials}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold text-slate-800 ${!user.isActive && "line-through"}`}>{user.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 align-middle">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Inactive</span>
                  )}
                </td>
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-slate-700 font-medium">{user.role}</span>
                    {user.isSysAdmin && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-500 border border-indigo-100">
                        SYS
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 align-middle"><span className="text-sm text-slate-400">{user.lastAction}</span></td>
                <td className="pr-4 py-3.5 align-middle text-right">
                  {isAdmin && (
                    <div className="flex justify-end text-slate-300 group-hover:text-slate-500 transition-colors">
                      <UserActionMenu userId={user.id} isActive={user.isActive} currentRoleId={user.roleId} roles={roles} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <UsersIcon size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">No members match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
