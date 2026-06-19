"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Users as UsersIcon } from "lucide-react";
import UserActionMenu from "@/components/workspace/UserActionMenu";
import { Tooltip } from "@/components/ui/Tooltip";

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

export default function UsersTable({
  users,
  roles,
  isAdmin = false,
}: {
  users: UserRow[];
  roles: { id: string; title: string }[];
  isAdmin?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [openMenu, setOpenMenu] = useState<"status" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesStatus =
        status === "ALL" || (status === "ACTIVE" ? u.isActive : !u.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [users, search, status]);

  const STATUS_LABEL: Record<StatusFilter, string> = {
    ALL: "All",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
  };

  const chip = (active: boolean) =>
      [
        "h-9 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all duration-300 text-[13px] font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
          : "border-border/80 bg-surface text-text-main hover:border-text-muted/40 hover:bg-surface-hover",
      ].join(" ");

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4" ref={filterRef}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={14}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-9 pr-4 py-2 text-[13px] font-semibold border border-border/80 bg-surface text-text-main rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-inner w-52 transition-all hover:border-text-muted/40"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            className={chip(status !== "ALL")}
          >
            Status: {STATUS_LABEL[status]} <ChevronDown size={12} />
          </button>
          {openMenu === "status" && (
            <div
              className="absolute left-0 mt-2 w-40 bg-surface rounded-2xl py-2 z-30 overflow-hidden animate-in zoom-in-95 duration-200 shadow-premium border border-border/80"
            >
              {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setOpenMenu(null);
                  }}
                  className={[
                    "w-full text-left px-4 py-2 text-[13px] font-bold transition-colors flex items-center justify-between",
                    status === s
                      ? "bg-indigo-50 text-indigo-900"
                      : "text-text-main hover:bg-surface-hover",
                  ].join(" ")}
                >
                  {STATUS_LABEL[s]}{" "}
                  {status === s && <Check size={13} strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {(search || status !== "ALL") && (
          <span className="text-xs text-text-muted ml-1">
            {filtered.length} of {users.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-visible bg-surface border border-border/80 shadow-premium animate-in zoom-in-95 duration-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-surface-hover/70">
              <th className="px-5 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                User
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-44">
                Role
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-36">
                Last Seen
              </th>
              <th className="pr-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-border/80 last:border-0 transition-colors group ${user.isActive ? "hover:bg-surface-hover/70" : "opacity-60"}`}
              >
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: user.avatarBg }}
                    >
                      {user.initials}
                    </div>
                    <div>
                      <div
                        className={`text-[15px] font-bold text-text-main ${!user.isActive && "line-through"}`}
                      >
                        {user.name}
                      </div>
                      <div className="text-[13px] font-medium text-text-muted mt-0.5">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 align-middle">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{" "}
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />{" "}
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-text-main">
                      {user.role}
                    </span>
                    {user.isSysAdmin && (
                      <Tooltip label="System administrator — full workspace access">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-500 border border-indigo-100 cursor-help">
                          SYS
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 align-middle">
                  <span className="text-[13px] font-medium text-text-muted">
                    {user.lastAction}
                  </span>
                </td>
                <td className="pr-4 py-3.5 align-middle text-right">
                  {isAdmin && (
                    <div className="flex justify-end text-slate-300 group-hover:text-text-muted transition-colors">
                      <UserActionMenu
                        userId={user.id}
                        isActive={user.isActive}
                        currentRoleId={user.roleId}
                        roles={roles}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <UsersIcon
                    size={28}
                    className="mx-auto mb-2 text-slate-200"
                  />
                  <p className="text-sm text-text-muted">
                    No members match your filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
