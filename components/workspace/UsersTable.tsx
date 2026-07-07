"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, MoreHorizontal } from "lucide-react";
import UserActionMenu from "@/components/workspace/UserActionMenu";
import InviteMemberButton from "@/components/workspace/InviteMemberButton";

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
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
    ALL: "All members",
    ACTIVE: "Active only",
    INACTIVE: "Inactive only",
  };

  const getRoleStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin" || r === "sys") return { bg: "var(--primary-soft)", color: "var(--primary-text)" };
    if (r === "test lead" || r === "lead") return { bg: "var(--info-soft-fill)", color: "var(--info)" };
    if (r === "engineer") return { bg: "var(--surface-2)", color: "var(--text-muted)" };
    return { bg: "var(--surface-2)", color: "var(--text-faint)" };
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-[10px] mb-[16px]">
        <div className="text-[16px] font-semibold text-text-main">
          Users <span className="text-text-faint font-normal">· {users.length}</span>
        </div>
        <div className="flex-1 min-w-[16px]" />
        
        <div className="flex items-center gap-[8px] h-[36px] px-[11px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] rounded-[9px] text-[12.5px] min-w-[200px] focus-within:shadow-[inset_0_0_0_1px_var(--primary-color)] transition-colors">
          <Search size={16} className="text-text-faint shrink-0" />
          <input
            type="text" 
            aria-label="Search members"
            placeholder="Search members" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-text-main placeholder:text-text-faint"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button 
            type="button"
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            aria-haspopup="menu"
            aria-expanded={openMenu === "status"}
            className="flex items-center gap-[6px] h-[36px] px-[12px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] rounded-[9px] text-[12.5px] font-medium text-text-main hover:bg-surface-hover transition-colors"
          >
            {STATUS_LABEL[status]}
            <ChevronDown size={16} className="text-text-faint" />
          </button>
          
          {openMenu === "status" && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-surface border border-border shadow-sm rounded-[9px] py-1 z-30" role="menu">
              {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={status === s}
                  onClick={() => { setStatus(s); setOpenMenu(null); }}
                  className={`w-full text-left px-3 py-1.5 text-[12.5px] ${status === s ? "bg-primary-soft text-primary font-medium" : "text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {isAdmin && <InviteMemberButton />}
      </div>

      <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[2fr_1.2fr_110px_110px_40px] gap-[14px] p-[10px_18px] text-[10.5px] font-semibold tracking-[0.06em] uppercase text-text-faint border-b border-border">
            <div>Member</div><div>Role</div><div>Status</div><div>Last seen</div><div></div>
          </div>
          
          {filtered.map((u) => {
            const roleStyle = getRoleStyle(u.role);
            const statusColor = u.isActive ? "var(--pass)" : "var(--text-faint)";
            
            return (
              <div key={u.id} className="grid grid-cols-[2fr_1.2fr_110px_110px_40px] gap-[14px] p-[12px_18px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors group">
                <div className="flex items-center gap-[11px] min-w-0">
                  <div 
                    className="w-[32px] h-[32px] rounded-full text-white flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: u.avatarBg }}
                  >
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${!u.isActive ? "line-through text-text-muted" : "text-text-main"}`}>{u.name}</div>
                    <div className="text-[11.5px] text-text-faint whitespace-nowrap overflow-hidden text-ellipsis">{u.email}</div>
                  </div>
                </div>

                <div>
                  <span 
                    className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold p-[3px_9px] rounded-[7px]"
                    style={{ background: roleStyle.bg, color: roleStyle.color }}
                  >
                    {u.role}
                    {u.isSysAdmin && <span className="text-[9px] uppercase opacity-60 ml-1">Sys</span>}
                  </span>
                </div>

                <div>
                  <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color: statusColor }}>
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: statusColor }}></span>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-[12px] text-text-muted">{u.lastAction}</div>

                <div className="flex justify-center text-text-faint group-hover:text-text-muted transition-colors">
                  {isAdmin ? (
                    <UserActionMenu
                      userId={u.id}
                      isActive={u.isActive}
                      currentRoleId={u.roleId}
                      roles={roles}
                    />
                  ) : (
                    <MoreHorizontal size={18} aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="p-[32px] text-center text-[13px] text-text-muted">
              No members match your search criteria.
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-[14px]">
        <span className="text-[12px] text-text-faint">{filtered.length} members · {users.filter(u => u.isActive).length} active</span>
      </div>
    </>
  );
}
