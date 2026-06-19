"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  MoreHorizontal,
  Check,
  Plus,
  X,
  Loader2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl shadow-premium border border-border/80 w-full max-w-sm p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-1">
              Delete group
            </h3>
            <p className="text-sm text-text-muted">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-hover hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface GroupMember {
  id: string;
  name: string | null;
  email: string;
}
interface GroupProject {
  id: string;
  name: string;
  code: string;
}
interface Group {
  id: string;
  title: string;
  description: string | null;
  members: number;
  projects: number;
  memberList?: GroupMember[];
  projectList?: GroupProject[];
}
interface WorkspaceUser {
  id: string;
  name: string | null;
  email: string;
}

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
function avatarMeta(u: { name?: string | null; email: string }) {
  const display = u.name || u.email.split("@")[0];
  const parts = display.split(" ");
  const initials = (
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : display.substring(0, 2)
  ).toUpperCase();
  let sum = 0;
  for (let i = 0; i < display.length; i++) sum += display.charCodeAt(i);
  return {
    display,
    initials,
    color: AVATAR_COLORS[sum % AVATAR_COLORS.length],
  };
}

export default function WorkspaceGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Drawer state (shared create + edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    memberIds: Set<string>;
  }>({
    title: "",
    description: "",
    memberIds: new Set(),
  });
  const [memberSearch, setMemberSearch] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/groups");
      if (res.ok) setGroups(await res.json());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load groups");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadGroups();
      try {
        const res = await fetch("/api/workspace/users");
        if (res.ok) setUsers(await res.json());
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    })();
  }, [loadGroups]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", description: "", memberIds: new Set() });
    setMemberSearch("");
    setDrawerOpen(true);
  };

  const openEdit = async (group: Group) => {
    setOpenMenuId(null);
    setEditingId(group.id);
    // Fetch fresh member list for the group
    let memberIds = new Set<string>((group.memberList || []).map((m) => m.id));
    if (!group.memberList) {
      const res = await fetch("/api/workspace/groups");
      if (res.ok) {
        const all: Group[] = await res.json();
        const g = all.find((x) => x.id === group.id);
        memberIds = new Set((g?.memberList || []).map((m) => m.id));
      }
    }
    setForm({
      title: group.title,
      description: group.description || "",
      memberIds,
    });
    setMemberSearch("");
    setDrawerOpen(true);
  };

  const toggleMember = (id: string) => {
    setForm((f) => {
      const next = new Set(f.memberIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...f, memberIds: next };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Group name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        memberIds: Array.from(form.memberIds),
      };
      const res = await fetch(
        editingId
          ? `/api/workspace/groups/${editingId}`
          : "/api/workspace/groups",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        toast.success(
          editingId
            ? "Group updated successfully"
            : "Group created successfully",
        );
        setDrawerOpen(false);
        await loadGroups();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save group");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    const backup = [...groups];
    setGroups((prev) => prev.filter((g) => g.id !== id));
    try {
      const res = await fetch(`/api/workspace/groups/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Group deleted successfully");
      } else {
        setGroups(backup);
        toast.error("Failed to delete group");
      }
    } catch (err) {
      console.error(err);
      setGroups(backup);
      toast.error("Error deleting group");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6 relative">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            User Groups
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {groups.length}
          </span>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-premium hover:-translate-y-0.5 transition-all duration-300"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={15} strokeWidth={2.5} /> Create Group
        </button>
      </div>

      <p className="text-sm text-text-muted mb-5">
        Manage user groups to easily assign permissions across projects.
      </p>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/80 rounded-2xl bg-surface shadow-premium animate-in zoom-in-95 duration-200">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <Users className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-main">No groups found</h3>
          <p className="text-text-muted mt-1 mb-4 text-sm max-w-sm text-center">
            Groups help you manage permissions and roles for multiple users at
            once.
          </p>
          <button
            onClick={openCreate}
            className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border/80 rounded-2xl shadow-premium overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-hover/70">
                <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Group Details
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-32">
                  Members
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="border-b border-border/80 last:border-0 hover:bg-surface-hover/70 transition-colors group/row"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-main text-sm">
                        {group.title}
                      </span>
                      <span className="text-xs text-text-muted mt-0.5">
                        {group.description || "No description provided."}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                      {group.members} {group.members === 1 ? "user" : "users"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {group.projectList && group.projectList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {group.projectList.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-hover text-text-muted"
                          >
                            {p.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted opacity-60 font-semibold">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setOpenMenuId(
                          openMenuId === group.id ? null : group.id,
                        );
                      }}
                      className="text-text-muted hover:text-primary p-1.5 rounded-xl hover:bg-primary/10 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuId === group.id && (
                      <div className="absolute right-12 top-10 w-44 bg-surface rounded-xl shadow-premium border border-border/80 z-50 py-1 text-left animate-in zoom-in-95 duration-200">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(group);
                          }}
                        >
                          Edit Group
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            setConfirmDeleteId(group.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border mt-1 pt-1"
                        >
                          Delete Group
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this group? Members will not be removed from the workspace."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Slide-out drawer for create/edit */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-md h-full shadow-premium animate-in slide-in-from-right duration-300 flex flex-col border-l border-border/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-main">
                {editingId ? "Edit Group" : "Create New Group"}
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-text-muted hover:text-text-muted p-1 rounded-md hover:bg-surface-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. QA Automation Team"
                  className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all bg-surface-hover"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What is the purpose of this group?"
                  className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm h-24 resize-none transition-all bg-surface-hover"
                />
              </div>

              {/* Member picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-text-main">
                    Members
                  </label>
                  <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {form.memberIds.size} selected
                  </span>
                </div>
                <div className="relative mb-2">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    size={14}
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-border bg-surface-hover rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                  />
                </div>
                <div className="border border-border rounded-lg max-h-56 overflow-y-auto divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-text-muted">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const a = avatarMeta(u);
                      const selected = form.memberIds.has(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMember(u.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-indigo-50/60" : "hover:bg-surface-hover"}`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ background: a.color }}
                          >
                            {a.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-main truncate">
                              {a.display}
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {u.email}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-indigo-600 text-white" : "border border-border"}`}
                          >
                            {selected && <Check size={13} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-hover/60 flex justify-end gap-3">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                style={{
                  background: "var(--primary)",
                }}
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Save Changes" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
