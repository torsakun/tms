"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus,
  Loader2,
  Users,
  Check,
  Search,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Group {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
  isAssigned: boolean;
}

interface Member {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    workspaceRole: { title: string } | null;
  };
}

interface WsMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  workspaceRole: { title: string } | null;
}

export function MembersListClient({
  initialMembers,
  projectCode,
}: {
  initialMembers: Member[];
  projectCode: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const [query, setQuery] = useState("");
  const [allWsMembers, setAllWsMembers] = useState<WsMember[]>([]);
  const [suggestions, setSuggestions] = useState<WsMember[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [grpRes, usrRes] = await Promise.all([
          fetch(`/api/projects/${projectCode}/groups`),
          fetch("/api/workspace/users"),
        ]);
        if (grpRes.ok) setGroups(await grpRes.json());
        if (usrRes.ok) setAllWsMembers(await usrRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setGroupsLoading(false);
      }
    })();
  }, [projectCode]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const q = val.toLowerCase();
    const existingIds = new Set(members.map((m) => m.userId));
    const filtered = allWsMembers
      .filter((u) => !existingIds.has(u.id))
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const addMember = async (u: WsMember) => {
    setAddingId(u.id);
    setShowDropdown(false);
    setQuery("");
    setSuggestions([]);
    try {
      const res = await fetch(`/api/projects/${projectCode}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role: "VIEWER" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setMembers((prev) => [
        ...prev,
        {
          id: `${u.id}-${projectCode}`,
          userId: u.id,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            workspaceRole: u.workspaceRole,
          },
        },
      ]);
      toast.success(`${u.name || u.email} added to project`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add member");
    } finally {
      setAddingId(null);
    }
  };

  const removeMember = async (userId: string) => {
    const prev = members;
    setMembers((m) => m.filter((x) => x.userId !== userId));
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/members/${userId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setMembers(prev);
        toast.error("Failed to remove member");
      } else toast.success("Member removed from project");
    } catch {
      setMembers(prev);
      toast.error("Something went wrong");
    }
  };

  const toggleGroup = async (group: Group) => {
    setTogglingId(group.id);
    const prev = groups;
    setGroups((gs) =>
      gs.map((g) =>
        g.id === group.id ? { ...g, isAssigned: !g.isAssigned } : g,
      ),
    );
    try {
      const res = await fetch(`/api/projects/${projectCode}/groups`, {
        method: group.isAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id }),
      });
      if (!res.ok) {
        setGroups(prev);
        toast.error("Failed");
      } else
        toast.success(
          group.isAssigned
            ? `Removed "${group.title}"`
            : `Assigned "${group.title}"`,
        );
    } catch {
      setGroups(prev);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const q = groupSearch.trim().toLowerCase();
    return (
      !q ||
      g.title.toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q)
    );
  });

  const resetModal = () => {
    setIsModalOpen(false);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Display the user's workspace role (or system role if no workspace role)
  const getRoleLabel = (member: Member) => {
    if (member.user.workspaceRole?.title)
      return member.user.workspaceRole.title;
    return member.user.role === "ADMIN" ? "Admin" : "Member";
  };

  const getRoleColor = (member: Member) => {
    const isAdmin =
      member.user.role === "ADMIN" ||
      member.user.workspaceRole?.title?.toLowerCase().includes("admin");
    if (isAdmin) return "bg-amber-100 text-amber-800";
    return "bg-surface-hover text-text-muted";
  };

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-main">Project Members</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage who has access to {projectCode}.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium hover:-translate-y-0.5 transition-all duration-300"
          style={{ background: "var(--primary)" }}
        >
          <UserPlus size={16} className="mr-2" />
          Add Member
        </button>
      </header>

      {/* Members table */}
      <div className="bg-surface rounded-2xl shadow-premium border border-border/80 overflow-hidden mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-hover border-b border-border">
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Workspace Role
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.userId} className="hover:bg-surface-hover transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                      {(m.user.name || m.user.email)[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-text-main">
                      {m.user.name || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {m.user.email}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(m)}`}
                  >
                    {(m.user.role === "ADMIN" ||
                      m.user.workspaceRole?.title
                        ?.toLowerCase()
                        .includes("admin")) && <ShieldCheck size={11} />}
                    {getRoleLabel(m)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeMember(m.userId)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-text-muted"
                >
                  No members yet. Add workspace members to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Groups section */}
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-base font-bold text-text-main flex items-center gap-2">
          <Users size={16} className="text-indigo-500" />
          Assigned Groups
        </h2>
        {groups.filter((g) => g.isAssigned).length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
            {groups.filter((g) => g.isAssigned).length}
          </span>
        )}
      </div>
      <p className="text-xs text-text-muted mb-4">
        Assign user groups to this project. All group members will inherit
        access.
      </p>

      <div className="bg-surface rounded-2xl shadow-premium border border-border/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80 bg-surface-hover/50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={14}
            />
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search groups…"
              className="w-full pl-8 pr-3 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
            />
          </div>
        </div>
        {groupsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="px-6 py-8 text-center text-text-muted text-sm">
            {groups.length === 0
              ? "No groups exist in this workspace yet."
              : "No groups match your search."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-surface-hover transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-main">
                      {group.title}
                    </div>
                    <div className="text-xs text-text-muted">
                      {group.memberCount}{" "}
                      {group.memberCount === 1 ? "member" : "members"}
                      {group.description ? ` · ${group.description}` : ""}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleGroup(group)}
                  disabled={togglingId === group.id}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-sm hover:-translate-y-0.5 ${
                    group.isAssigned
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-surface border border-border text-text-muted hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {togglingId === group.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : group.isAssigned ? (
                    <>
                      <Check size={12} strokeWidth={3} /> Assigned
                    </>
                  ) : (
                    <>+ Assign</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={resetModal}
        >
          <div
            className="bg-surface rounded-2xl shadow-premium border border-border/80 w-full max-w-md overflow-visible animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-border/80 flex justify-between items-center bg-surface-hover/50 rounded-t-2xl">
              <h2 className="text-base font-bold text-text-main">
                Add Member to Project
              </h2>
              <button
                onClick={resetModal}
                className="text-text-muted hover:text-text-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                Search workspace member
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-text-muted z-10"
                  size={15}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() =>
                    suggestions.length > 0 && setShowDropdown(true)
                  }
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search by name or email…"
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2.5 border border-border/80 rounded-xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-surface-hover transition-all shadow-inner hover:border-text-muted/40"
                />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-premium border border-border/80 z-50 overflow-hidden max-h-56 overflow-y-auto">
                    {suggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={() => addMember(u)}
                        disabled={addingId === u.id}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-text-main truncate">
                            {u.name || u.email}
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            {u.email}
                          </div>
                        </div>
                        <span className="text-xs text-text-muted shrink-0">
                          {u.workspaceRole?.title ||
                            (u.role === "ADMIN" ? "Admin" : "Member")}
                        </span>
                        {addingId === u.id ? (
                          <Loader2
                            size={14}
                            className="animate-spin text-indigo-500 shrink-0"
                          />
                        ) : (
                          <span className="text-xs text-indigo-500 font-semibold shrink-0 ml-2">
                            + Add
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Members are added instantly. Access is based on their workspace
                role.
              </p>

              {members.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Current members ({members.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between px-4 py-2.5 bg-surface-hover border border-border/80 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0">
                            {(m.user.name || m.user.email)[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-text-main">
                            {m.user.name || m.user.email}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-text-muted">
                            {getRoleLabel(m)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeMember(m.userId)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={resetModal}
                  className="px-5 py-2.5 text-[13px] font-bold text-text-main bg-surface-hover border border-border/80 hover:border-text-muted/40 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
