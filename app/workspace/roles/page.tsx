"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Lock,
  MoreHorizontal,
  Check,
  Loader2,
  ListChecks,
  LayoutDashboard,
  Bug,
  Server,
  Type,
  ClipboardCheck,
  FolderCog,
  PlayCircle,
  FolderOpen,
  Tag,
  Building2,
  type LucideIcon,
} from "lucide-react";

const BLOCK_ICONS: Record<string, LucideIcon> = {
  "test-cases": ListChecks,
  dashboards: LayoutDashboard,
  defects: Bug,
  environments: Server,
  fields: Type,
  "test-plans": ClipboardCheck,
  projects: FolderCog,
  "test-runs": PlayCircle,
  "test-suites": FolderOpen,
  tags: Tag,
  workspace: Building2,
};

const PERMISSION_BLOCKS = [
  {
    id: "test-cases", name: "Test cases", icon: "rule_settings",
    rules: [
      { id: "tc-repository", label: "View test cases" },
      { id: "tc-create", label: "Create/update" },
      { id: "tc-remove", label: "Remove" },
      { id: "tc-sort", label: "Change sort order" },
      { id: "tc-approve", label: "Approve/Decline" },
      { id: "tc-rollback", label: "Rollback" },
      { id: "tc-mute", label: "Mute/Unmute" },
    ],
  },
  {
    id: "dashboards", name: "Dashboards", icon: "dashboard",
    rules: [
      { id: "db-view", label: "View" },
      { id: "db-create", label: "Create" },
      { id: "db-update", label: "Update" },
      { id: "db-remove", label: "Remove" },
    ],
  },
  {
    id: "defects", name: "Defects", icon: "bug_report",
    rules: [
      { id: "df-view", label: "View" },
      { id: "df-create", label: "Create/update" },
      { id: "df-remove", label: "Remove" },
      { id: "df-resolve", label: "Resolve" },
    ],
  },
  {
    id: "environments", name: "Environments", icon: "dns",
    rules: [
      { id: "env-view", label: "View" },
      { id: "env-create", label: "Create/update" },
      { id: "env-remove", label: "Remove" },
    ],
  },
  {
    id: "fields", name: "Fields", icon: "text_fields",
    rules: [
      { id: "fld-view", label: "View" },
      { id: "fld-update", label: "Update" },
      { id: "fld-create", label: "Create" },
      { id: "fld-remove", label: "Remove" },
    ],
  },
  {
    id: "test-plans", name: "Test plans", icon: "fact_check",
    rules: [
      { id: "tp-view", label: "View" },
      { id: "tp-create", label: "Create/update" },
      { id: "tp-remove", label: "Remove" },
    ],
  },
  {
    id: "projects", name: "Projects", icon: "folder_special",
    rules: [
      { id: "prj-create", label: "Create/update" },
      { id: "prj-remove", label: "Remove" },
      { id: "prj-access", label: "Access control" },
      { id: "prj-owner", label: "Change ownership" },
      { id: "prj-import", label: "Import" },
      { id: "prj-export", label: "Export" },
    ],
  },
  {
    id: "test-runs", name: "Test runs", icon: "play_circle",
    rules: [
      { id: "tr-view", label: "View" },
      { id: "tr-create", label: "Create/update" },
      { id: "tr-remove", label: "Remove" },
      { id: "tr-submit", label: "Submit results" },
      { id: "tr-assign", label: "Assign" },
      { id: "tr-config", label: "Manage configurations" },
    ],
  },
  {
    id: "test-suites", name: "Test suites", icon: "folder_open",
    rules: [
      { id: "ts-create", label: "Create/update" },
      { id: "ts-remove", label: "Remove" },
      { id: "ts-position", label: "Change suite position" },
    ],
  },
  {
    id: "tags", name: "Tags", icon: "sell",
    rules: [
      { id: "tg-view", label: "View" },
      { id: "tg-create", label: "Create/update" },
      { id: "tg-remove", label: "Remove" },
    ],
  },
  {
    id: "workspace", name: "Workspace", icon: "corporate_fare",
    rules: [
      { id: "ws-update", label: "Update settings" },
      { id: "ws-invite", label: "Invite" },
      { id: "ws-activate", label: "Activate/deactivate" },
      { id: "ws-user-update", label: "User update" },
      { id: "ws-users-view", label: "View users" },
      { id: "ws-logs", label: "Logs" },
    ],
  },
];

const ALL_RULE_IDS = PERMISSION_BLOCKS.flatMap((b) => b.rules.map((r) => r.id));

interface WorkspaceRole {
  id: string;
  title: string;
  description: string | null;
  permissions: unknown;
  isDefault: boolean;
  isSystem: boolean;
  _count?: {
    users?: number;
  };
}

interface RolesResponse {
  success?: boolean;
  roles?: WorkspaceRole[];
}

function buildPermMap(permissions: string[]): Record<string, boolean> {
  const perms: Record<string, boolean> = {};
  if (permissions.includes("all")) {
    ALL_RULE_IDS.forEach((id) => {
      perms[id] = true;
    });
  } else {
    permissions.forEach((p) => {
      perms[p] = true;
    });
  }
  return perms;
}

export default function WorkspaceRolesPage() {
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPerms, setFormPerms] = useState<Record<string, boolean>>({});
  const [isSystem, setIsSystem] = useState(false);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);

  const fetchRoles = useCallback(() => {
    fetch("/api/workspace/roles")
      .then((res) => res.json())
      .then((data: RolesResponse) => {
        const nextRoles = data.roles ?? [];
        if (data.success) {
          setRoles(nextRoles);
          if (nextRoles.length > 0 && !editingId) {
            handleEdit(nextRoles[0]);
          }
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [editingId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = (role: WorkspaceRole) => {
    setOpenRoleMenuId(null);
    setEditingId(role.id);
    setFormTitle(role.title);
    setFormDescription(role.description || "");
    setIsSystem(role.isSystem);
    setFormIsDefault(!!role.isDefault);
    setFormPerms(buildPermMap(Array.isArray(role.permissions) ? role.permissions : []));
  };

  const handleCreateNew = () => {
    setOpenRoleMenuId(null);
    setEditingId("new");
    setFormTitle("New Role");
    setFormDescription("");
    setIsSystem(false);
    setFormIsDefault(false);
    setFormPerms({});
  };

  const togglePermission = (id: string) => {
    if (isSystem) return;
    setFormPerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error("Role title is required");
      return;
    }
    setIsSubmitting(true);
    
    const activePermissions = Object.entries(formPerms)
      .filter((entry) => entry[1])
      .map(([k]) => k);

    try {
      const url = editingId === "new" ? "/api/workspace/roles" : `/api/workspace/roles/${editingId}`;
      const method = editingId === "new" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          isDefault: formIsDefault,
          permissions: activePermissions,
        }),
      });

      if (res.ok) {
        toast.success(editingId === "new" ? "Role created" : "Role updated");
        if (editingId === "new") {
          const data = await res.json();
          setEditingId(data.role?.id || null);
        }
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save role");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setOpenRoleMenuId(null);
    try {
      const res = await fetch(`/api/workspace/roles/${id}/default`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Default role updated");
        fetchRoles();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to set default role");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    setOpenRoleMenuId(null);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/workspace/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Role deleted");
        if (editingId === id) {
          const rem = roles.filter(r => r.id !== id);
          if (rem.length > 0) handleEdit(rem[0]);
          else handleCreateNew();
        }
        fetchRoles();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to delete role");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1120px] mx-auto p-[20px_22px] flex justify-center mt-10">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1120px] mx-auto p-[20px_22px] grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start antialiased font-sans">
      
      {/* role list */}
      <div>
        <div className="flex items-center gap-[12px] mb-[14px]">
          <div className="text-[16px] font-semibold text-text-main">
            Roles <span className="text-text-faint font-normal">· {roles.length}</span>
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={handleCreateNew}>
            <Plus size={16} />
            New role
          </Button>
        </div>
        
        <div className="flex flex-col gap-[10px]">
          {roles.map((r) => {
            const isSystemRole = r.isSystem;
            const tagBg = isSystemRole ? "var(--surface-2)" : "var(--primary-soft)";
            const tagColor = isSystemRole ? "var(--text-muted)" : "var(--primary-text)";
            const isSelected = r.id === editingId;
            const borderC = isSelected ? "var(--primary)" : "var(--border)";
            
            return (
              <div 
                key={r.id} 
                onClick={() => handleEdit(r)}
                className="bg-surface rounded-[12px] p-[14px_16px] shadow-sm cursor-pointer hover:shadow-md transition-all"
                style={{ border: `1px solid ${borderC}` }}
              >
                <div className="flex items-center gap-[9px]">
                  <span className="text-[13.5px] font-semibold text-text-main">{r.title}</span>
                  <span
                    className="text-[10px] font-bold p-[1px_7px] rounded-full uppercase tracking-wider"
                    style={{ background: tagBg, color: tagColor }}
                  >
                    {isSystemRole ? "System" : "Custom"}
                  </span>
                  {r.isDefault && (
                    <span
                      className="text-[10px] font-bold p-[1px_7px] rounded-full uppercase tracking-wider"
                      style={{ background: "var(--pass-soft)", color: "var(--pass)" }}
                    >
                      Default
                    </span>
                  )}
                  <div className="flex-1" />
                  <span className="text-[11.5px] text-text-faint">{r._count?.users || 0} members</span>
                  
                  <div className="relative group/menu" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      aria-label={`Open actions for ${r.title}`}
                      aria-haspopup="menu"
                      aria-expanded={openRoleMenuId === r.id}
                      onClick={() => setOpenRoleMenuId(openRoleMenuId === r.id ? null : r.id)}
                      className="text-text-faint hover:text-text-main flex items-center"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                    <div
                      role="menu"
                      className={`absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-[9px] shadow-sm transition-all z-10 py-1 ${
                        openRoleMenuId === r.id
                          ? "opacity-100 visible"
                          : "opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible"
                      }`}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSetDefault(r.id)}
                        disabled={r.isDefault}
                        className="w-full text-left px-3 py-1.5 text-[12.5px] text-text-main hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        {r.isDefault ? "Default role" : "Set as default"}
                      </button>
                      {!isSystemRole && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="w-full text-left px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger-soft transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {isSystemRole && <Lock size={15} className="text-text-faint" />}
                </div>
                <div className="text-[12px] text-text-muted mt-[6px]">{r.description || "No description"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* role edit */}
      {(editingId || editingId === "new") && (
        <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden sticky top-6">
          <div className="p-[16px_18px] border-b border-border">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-text-faint flex items-center justify-between">
              {editingId === "new" ? "Create new role" : "Editing role"}
              {isSystem && <span className="text-warning flex items-center gap-1"><Lock size={13} /> System role</span>}
            </div>
            <div className="flex items-center h-[40px] px-[13px] mt-[8px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[14px] font-semibold focus-within:shadow-[inset_0_0_0_1.5px_var(--primary-color)] transition-shadow">
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                disabled={isSystem}
                className="w-full bg-transparent outline-none text-text-main disabled:opacity-70"
                placeholder="Role Name"
              />
            </div>
            <div className="flex p-[8px_13px] mt-[8px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_1.5px_var(--primary-color)] transition-shadow">
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                disabled={isSystem}
                className="w-full bg-transparent outline-none text-text-main h-[40px] resize-none disabled:opacity-70"
                placeholder="Description"
              />
            </div>
          </div>
          
          <div className="p-[6px_18px_16px] max-h-[500px] overflow-y-auto">
            {PERMISSION_BLOCKS.map((g) => {
              const BlockIcon = BLOCK_ICONS[g.id] ?? ListChecks;
              return (
              <div key={g.id} className="p-[14px_0_4px]">
                <div className="flex items-center gap-[7px] text-[11px] font-semibold tracking-[0.05em] uppercase text-text-faint mb-[8px]">
                  <BlockIcon size={14} />
                  {g.name}
                </div>
                {g.rules.map((p) => {
                  const isOn = formPerms[p.id];
                  return (
                    <button
                      type="button"
                      key={p.id} 
                      role="switch"
                      aria-checked={!!isOn}
                      disabled={isSystem}
                      className={`w-full text-left flex items-center gap-[10px] p-[8px_0] border-t border-border bg-transparent ${!isSystem ? "cursor-pointer" : "cursor-not-allowed"}`}
                      onClick={() => togglePermission(p.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-text-main">{p.label}</div>
                      </div>
                      <div 
                        className="w-[34px] h-[20px] rounded-full relative shrink-0 transition-colors"
                        style={{ background: isOn ? "var(--primary)" : "var(--surface-2)" }}
                      >
                        <div 
                          className="absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full transition-all shadow-sm"
                          style={{ left: isOn ? "16px" : "2px" }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            );})}
          </div>
          
          {!isSystem && (
            <div className="flex justify-end gap-[9px] p-[14px_18px] border-t border-border bg-surface">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingId === "new") {
                    setEditingId(null);
                  } else {
                    const r = roles.find(x => x.id === editingId);
                    if (r) handleEdit(r);
                  }
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save role
              </Button>
            </div>
          )}
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this role? Users assigned this role will be moved to the default role."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
