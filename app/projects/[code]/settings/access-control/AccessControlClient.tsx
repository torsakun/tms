"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Lock,
  Globe,
  Check,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Owner {
  id?: string;
  name: string | null;
  email: string;
}
interface AssignedGroup {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
}
interface AssignedMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}
interface Group {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
  isAssigned: boolean;
}
interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

type PrivateTab = "groups" | "members";

export function AccessControlClient({
  projectCode,
  accessType: initialAccessType,
  owner: initialOwner,
  assignedMembers: initialMembers,
}: {
  projectCode: string;
  accessType: "PUBLIC" | "PRIVATE";
  owner: Owner | null;
  assignedGroups: AssignedGroup[];
  assignedMembers: AssignedMember[];
}) {
  const [accessType, setAccessType] = useState<"PUBLIC" | "PRIVATE">(
    initialAccessType,
  );
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState<Owner | null>(initialOwner);
  const [activeTab, setActiveTab] = useState<PrivateTab>("groups");

  // Edit-owner modal
  const [editOwnerOpen, setEditOwnerOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");

  // Groups
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);

  // Members
  const [wsMembers, setWsMembers] = useState<WorkspaceMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [assignedMembers, setAssignedMembers] =
    useState<AssignedMember[]>(initialMembers);

  useEffect(() => {
    (async () => {
      setGroupsLoading(true);
      try {
        const [grpRes, usrRes] = await Promise.all([
          fetch(`/api/projects/${projectCode}/groups`),
          fetch("/api/workspace/users"),
        ]);
        if (grpRes.ok) setAllGroups(await grpRes.json());
        if (usrRes.ok) setWsMembers(await usrRes.json());
      } finally {
        setGroupsLoading(false);
      }
    })();
  }, [projectCode]);

  const saveAccessType = async (type: "PUBLIC" | "PRIVATE") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessType: type }),
      });
      if (!res.ok) throw new Error();
      setAccessType(type);
      toast.success(
        `Project set to ${type === "PUBLIC" ? "Public" : "Private"}`,
      );
    } catch {
      toast.error("Failed to update access type");
    } finally {
      setSaving(false);
    }
  };

  const changeOwner = async (user: WorkspaceMember) => {
    try {
      await fetch(`/api/projects/${projectCode}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: "ADMIN" }),
      });
      setOwner({ id: user.id, name: user.name, email: user.email });
      setEditOwnerOpen(false);
      setOwnerSearch("");
      toast.success(`Owner changed to ${user.name || user.email}`);
    } catch {
      toast.error("Failed to change owner");
    }
  };

  const toggleGroup = async (group: Group) => {
    setTogglingGroupId(group.id);
    const prev = allGroups;
    setAllGroups((gs) =>
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
        setAllGroups(prev);
        toast.error("Failed to update group");
      } else
        toast.success(
          group.isAssigned
            ? `Removed "${group.title}"`
            : `Added "${group.title}"`,
        );
    } catch {
      setAllGroups(prev);
    } finally {
      setTogglingGroupId(null);
    }
  };

  const addMember = async (user: WorkspaceMember) => {
    if (assignedMembers.some((m) => m.id === user.id)) return;
    setAddingMemberId(user.id);
    try {
      const res = await fetch(`/api/projects/${projectCode}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: "VIEWER" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setAssignedMembers((prev) => [
        ...prev,
        { id: user.id, name: user.name, email: user.email, role: "VIEWER" },
      ]);
      toast.success(`Added ${user.name || user.email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add member");
    } finally {
      setAddingMemberId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    const prev = assignedMembers;
    setAssignedMembers((m) => m.filter((x) => x.id !== memberId));
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/members/${memberId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setAssignedMembers(prev);
        toast.error("Failed to remove member");
      } else toast.success("Member removed");
    } catch {
      setAssignedMembers(prev);
    }
  };

  const filteredGroups = allGroups.filter(
    (g) =>
      !groupSearch || g.title.toLowerCase().includes(groupSearch.toLowerCase()),
  );
  const assignedGroups = allGroups.filter((g) => g.isAssigned);
  const filteredWsMembers = wsMembers.filter((u) => {
    const q = memberSearch.toLowerCase();
    return (
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });
  const ownerCandidates = wsMembers.filter((u) => {
    const q = ownerSearch.toLowerCase();
    return (
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-10">
      {/* ── Project owner ── */}
      <section>
        <p className="text-[13px] font-bold text-text-main mb-4 uppercase tracking-wider">
          Project owner
        </p>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-sidebar-bg flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-inner">
            {owner?.name?.[0]?.toUpperCase() ||
              owner?.email?.[0]?.toUpperCase() ||
              "?"}
          </div>
          <span className="text-[15px] font-semibold text-text-main">
            {owner?.name || owner?.email || "No owner set"}
          </span>
          <button
            onClick={() => setEditOwnerOpen(true)}
            className="px-5 py-2.5 text-[13px] font-bold text-text-main border border-border/80 bg-surface rounded-xl hover:bg-surface-hover hover:border-primary/40 hover:text-primary transition-all shadow-sm hover:-translate-y-0.5 duration-300"
          >
            Edit owner
          </button>
        </div>
      </section>

      {/* ── Project access type ── */}
      <section>
        <p className="text-[13px] font-bold text-text-main mb-4 uppercase tracking-wider">
          Project access type
        </p>

        <div className="space-y-4 bg-surface p-5 rounded-2xl border border-border/80 shadow-premium">
          {/* Public */}
          <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-surface-hover/50 transition-colors">
            <div
              onClick={() => saveAccessType("PUBLIC")}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                accessType === "PUBLIC"
                  ? "border-primary bg-primary shadow-sm"
                  : "border-border group-hover:border-primary/40"
              }`}
            >
              {accessType === "PUBLIC" && (
                <div className="w-2 h-2 rounded-full bg-surface" />
              )}
            </div>
            <div
              className="flex items-center gap-2.5"
              onClick={() => saveAccessType("PUBLIC")}
            >
              <Globe
                size={18}
                className={
                  accessType === "PUBLIC" ? "text-primary" : "text-text-muted"
                }
              />
              <span className="text-[15px] font-semibold text-text-main">
                Public
              </span>
              <span className="text-[14px] text-text-muted">
                — visible to all workspace members
              </span>
            </div>
          </label>

          {/* Private */}
          <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-surface-hover/50 transition-colors">
            <div
              onClick={() => saveAccessType("PRIVATE")}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                accessType === "PRIVATE"
                  ? "border-primary bg-primary shadow-sm"
                  : "border-border group-hover:border-primary/40"
              }`}
            >
              {accessType === "PRIVATE" && (
                <div className="w-2 h-2 rounded-full bg-surface" />
              )}
            </div>
            <div
              className="flex items-center gap-2.5"
              onClick={() => saveAccessType("PRIVATE")}
            >
              <Lock
                size={18}
                className={
                  accessType === "PRIVATE"
                    ? "text-primary"
                    : "text-text-muted"
                }
              />
              <span className="text-[15px] font-semibold text-text-main">
                Private
              </span>
              <span className="text-[14px] text-text-muted">
                — only assigned users and groups
              </span>
            </div>
          </label>
        </div>

        {saving && (
          <div className="flex items-center gap-2 mt-4 text-sm text-primary">
            <Loader2 size={14} className="animate-spin" /> Saving…
          </div>
        )}
      </section>

      {/* ── Private: Groups + Individual members ── */}
      {accessType === "PRIVATE" && (
        <section>
          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveTab("groups")}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium transition-all hover:-translate-y-0.5 duration-300"
              style={{
                background: "var(--primary)",
              }}
            >
              <Users size={16} /> Add groups
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium transition-all hover:-translate-y-0.5 duration-300"
              style={{
                background: "var(--primary)",
              }}
            >
              <UserPlus size={16} /> Add individual users
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="border-b border-border mb-6">
            <nav className="flex -mb-px gap-1">
              {(["groups", "members"] as PrivateTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-[15px] font-semibold border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  {tab === "groups"
                    ? `Groups${assignedGroups.length ? ` (${assignedGroups.length})` : ""}`
                    : `Individual members${assignedMembers.length ? ` (${assignedMembers.length})` : ""}`}
                </button>
              ))}
            </nav>
          </div>

          {/* Groups tab */}
          {activeTab === "groups" && (
            <div>
              <div className="relative mb-4">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups…"
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40 text-text-main placeholder:text-text-muted/50"
                />
              </div>

              {groupsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-12 text-center text-[15px] text-text-muted">
                  {allGroups.length === 0
                    ? "No groups in workspace yet."
                    : "No groups match your search."}
                </div>
              ) : (
                <div className="border border-border/80 rounded-2xl bg-surface overflow-hidden shadow-premium divide-y divide-border/80">
                  {filteredGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover/70 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                          <Users size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold text-text-main">
                            {g.title}
                          </div>
                          <div className="text-sm text-text-muted mt-0.5">
                            {g.memberCount}{" "}
                            {g.memberCount === 1 ? "member" : "members"}
                            {g.description ? ` · ${g.description}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleGroup(g)}
                        disabled={togglingGroupId === g.id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm hover:-translate-y-0.5 duration-300 ${
                          g.isAssigned
                            ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                            : "bg-surface border border-border/80 text-text-muted hover:border-primary/40 hover:text-primary"
                        }`}
                      >
                        {togglingGroupId === g.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : g.isAssigned ? (
                          <>
                            <Check size={14} strokeWidth={3} /> Added
                          </>
                        ) : (
                          "+ Add"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Individual members tab */}
          {activeTab === "members" && (
            <div>
              <div className="relative mb-4">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search workspace members…"
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40 text-text-main placeholder:text-text-muted/50"
                />
              </div>

              {filteredWsMembers.length === 0 ? (
                <div className="py-12 text-center text-[15px] text-text-muted">
                  No users found.
                </div>
              ) : (
                <div className="border border-border/80 rounded-2xl bg-surface overflow-hidden shadow-premium divide-y divide-border/80">
                  {filteredWsMembers.map((u) => {
                    const isAdded = assignedMembers.some((m) => m.id === u.id);
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover/70 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted text-sm font-bold shrink-0">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[15px] font-semibold text-text-main">
                              {u.name || u.email}
                            </div>
                            <div className="text-sm text-text-muted mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        {isAdded ? (
                          <button
                            onClick={() => removeMember(u.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold bg-primary text-primary-foreground hover:bg-danger transition-all shadow-sm group hover:-translate-y-0.5 duration-300"
                          >
                            <span className="group-hover:hidden flex items-center gap-1.5">
                              <Check size={14} strokeWidth={3} /> Added
                            </span>
                            <span className="hidden group-hover:flex items-center gap-1.5">
                              <X size={14} /> Remove
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => addMember(u)}
                            disabled={addingMemberId === u.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold bg-surface border border-border/80 text-text-muted hover:border-primary/40 hover:text-primary transition-all shadow-sm hover:-translate-y-0.5 duration-300"
                          >
                            {addingMemberId === u.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "+ Add"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assigned list summary */}
              {assignedMembers.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
                    Currently assigned ({assignedMembers.length})
                  </p>
                  <div className="space-y-2">
                    {assignedMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3 bg-primary-light border border-primary/20 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {(m.name || m.email)[0].toUpperCase()}
                          </div>
                          <span className="text-[15px] text-text-main font-medium">
                            {m.name || m.email}
                          </span>
                        </div>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="text-text-muted hover:text-danger transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Edit Owner Modal ── */}
      {editOwnerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditOwnerOpen(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-premium border border-border/80 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between bg-surface-hover/50">
              <h3 className="text-base font-bold text-text-main">
                Change project owner
              </h3>
              <button
                onClick={() => setEditOwnerOpen(false)}
                className="text-text-muted hover:text-text-muted transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="relative mb-4">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  size={15}
                />
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Search members…"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface-hover focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40 text-text-main placeholder:text-text-muted/50"
                />
              </div>
              <div className="divide-y divide-border/80 max-h-64 overflow-y-auto rounded-xl border border-border/80 shadow-inner">
                {ownerCandidates.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-muted">
                    No users found
                  </div>
                ) : (
                  ownerCandidates.map((u) => {
                    const isCurrent =
                      owner?.id === u.id || owner?.email === u.email;
                    return (
                      <button
                        key={u.id}
                        onClick={() => changeOwner(u)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${isCurrent ? "bg-primary-light" : "hover:bg-surface-hover"}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0">
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
                        {isCurrent && (
                          <Check
                            size={16}
                            className="text-primary shrink-0"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
