"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

const PERMISSION_BLOCKS = [
  {
    id: "test-cases",
    title: "Test cases",
    description: "Rules for managing test cases.",
    rules: [
      {
        id: "tc-repository",
        name: "Repository",
        desc: "View test cases in the repository.",
      },
      {
        id: "tc-create",
        name: "Create/update",
        desc: "Create or update test cases.",
      },
      { id: "tc-remove", name: "Remove", desc: "Delete a test case." },
      {
        id: "tc-sort",
        name: "Change sort order",
        desc: "Drag and drop test cases on the repository page.",
      },
      {
        id: "tc-approve",
        name: "Approve/Decline",
        desc: "Approve or decline test case changes during review.",
      },
      {
        id: "tc-rollback",
        name: "Rollback",
        desc: "Undo changes done to test cases.",
      },
      {
        id: "tc-mute",
        name: "Mute/Unmute",
        desc: "Mute or unmute a test case.",
      },
    ],
  },
  {
    id: "dashboards",
    title: "Dashboards",
    description: "Rules for managing dashboards.",
    rules: [
      { id: "db-view", name: "View", desc: "View existing dashboards." },
      {
        id: "db-create",
        name: "Create",
        desc: "Create, update, and remove dashboards.",
      },
      { id: "db-update", name: "Update", desc: "Update any dashboards." },
      { id: "db-remove", name: "Remove", desc: "Delete any dashboards." },
    ],
  },
  {
    id: "defects",
    title: "Defects",
    description: "Rules for managing defects.",
    rules: [
      { id: "df-view", name: "View", desc: "View a list of existing defects." },
      {
        id: "df-create",
        name: "Create/update",
        desc: "Create or update defects.",
      },
      { id: "df-remove", name: "Remove", desc: "Delete defects." },
      { id: "df-resolve", name: "Resolve", desc: "Resolve open defects." },
    ],
  },
  {
    id: "environments",
    title: "Environments",
    description: "Rules for managing environments.",
    rules: [
      {
        id: "env-view",
        name: "View",
        desc: "View a list of existing environments.",
      },
      {
        id: "env-create",
        name: "Create/update",
        desc: "Create or update environments.",
      },
      { id: "env-remove", name: "Remove", desc: "Delete environments." },
    ],
  },
  {
    id: "fields",
    title: "Fields",
    description: "Rules for managing fields.",
    rules: [
      { id: "fld-view", name: "View", desc: "View a list of existing fields." },
      { id: "fld-update", name: "Update", desc: "Update fields." },
      { id: "fld-create", name: "Create", desc: "Create custom fields." },
      { id: "fld-remove", name: "Remove", desc: "Delete custom fields." },
    ],
  },
  {
    id: "test-plans",
    title: "Test plans",
    description: "Rules for managing test plans.",
    rules: [
      {
        id: "tp-view",
        name: "View",
        desc: "View a list of existing test plans.",
      },
      {
        id: "tp-create",
        name: "Create/update",
        desc: "Create or update test plans.",
      },
      { id: "tp-remove", name: "Remove", desc: "Delete test plans." },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    description: "Rules for managing projects.",
    rules: [
      {
        id: "prj-create",
        name: "Create/update",
        desc: "Create new projects and update their settings.",
      },
      {
        id: "prj-remove",
        name: "Remove",
        desc: "Delete and archive projects.",
      },
      {
        id: "prj-access",
        name: "Access control",
        desc: "Manage access to the project: add or remove members.",
      },
      {
        id: "prj-owner",
        name: "Change ownership",
        desc: "Change the project owner.",
      },
      {
        id: "prj-import",
        name: "Import",
        desc: "Import test cases from various sources.",
      },
      { id: "prj-export", name: "Export", desc: "Export test cases." },
    ],
  },
  {
    id: "test-runs",
    title: "Test runs",
    description: "Rules for managing test runs.",
    rules: [
      {
        id: "tr-view",
        name: "View",
        desc: "View a list of existing test runs.",
      },
      {
        id: "tr-create",
        name: "Create/update",
        desc: "Create or update test runs.",
      },
      { id: "tr-remove", name: "Remove", desc: "Delete test runs." },
      { id: "tr-submit", name: "Submit results", desc: "Submit run results." },
      { id: "tr-assign", name: "Assign", desc: "Set assignee." },
      {
        id: "tr-config",
        name: "Manage configurations",
        desc: "Create, update, or delete configurations.",
      },
    ],
  },
  {
    id: "test-suites",
    title: "Test suites",
    description: "Rules for managing test suites.",
    rules: [
      {
        id: "ts-create",
        name: "Create/update",
        desc: "Create or update test suites.",
      },
      {
        id: "ts-remove",
        name: "Remove",
        desc: "Delete test suites and move their content to another suite.",
      },
      {
        id: "ts-position",
        name: "Change suite position",
        desc: "Drag and drop test suites on the repository page.",
      },
    ],
  },
  {
    id: "tags",
    title: "Tags",
    description: "Rules for managing tags.",
    rules: [
      {
        id: "tg-view",
        name: "View",
        desc: "View a list of existing tags in the workspace.",
      },
      {
        id: "tg-create",
        name: "Create/update",
        desc: "Create tags on the fly.",
      },
      {
        id: "tg-remove",
        name: "Remove",
        desc: "Delete tags in the workspace.",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Rules for managing workspace.",
    rules: [
      {
        id: "ws-update",
        name: "Update settings",
        desc: "Update workspace settings.",
      },
      {
        id: "ws-invite",
        name: "Invite",
        desc: "Invite new members to the workspace.",
      },
      {
        id: "ws-activate",
        name: "Activate/deactivate",
        desc: "Activate or deactivate workspace users.",
      },
      {
        id: "ws-user-update",
        name: "User update",
        desc: "Change user details and roles.",
      },
      { id: "ws-users-view", name: "View users", desc: "View users." },
      { id: "ws-logs", name: "Logs", desc: "View logs." },
    ],
  },
];

const ALL_RULE_IDS = PERMISSION_BLOCKS.flatMap((b) => b.rules.map((r) => r.id));

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

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSystem, setIsSystem] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/workspace/roles/${roleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const role = data.role;
          setTitle(role.title);
          setDescription(role.description || "");
          setIsDefault(role.isDefault);
          setIsSystem(role.isSystem);
          setSelectedPermissions(
            buildPermMap(
              Array.isArray(role.permissions) ? role.permissions : [],
            ),
          );
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [roleId]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Role title and description are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const activePermissions = Object.entries(selectedPermissions)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      const res = await fetch(`/api/workspace/roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isDefault,
          permissions: activePermissions,
        }),
      });

      if (res.ok) {
        toast.success("Role updated successfully");
        router.push("/workspace/roles");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBlock = (ruleIds: string[]) => {
    setSelectedPermissions((prev) => {
      const allChecked = ruleIds.every((id) => prev[id]);
      const next = { ...prev };
      ruleIds.forEach((id) => {
        next[id] = !allChecked;
      });
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/workspace/roles"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-muted hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Shield size={15} className="text-indigo-500" />
          </div>
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            Edit role
          </h1>
        </div>
        {isSystem && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-hover text-text-muted border border-border uppercase tracking-wide">
            System
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Role Settings Card */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-premium p-6 animate-in zoom-in-95 duration-200">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4">
            Role settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">
                Role title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSystem}
                className="w-full px-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface text-text-main focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary disabled:bg-surface-hover disabled:text-text-muted transition-all shadow-inner hover:border-text-muted/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface text-text-main focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary resize-none transition-all shadow-inner hover:border-text-muted/40"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-sm font-semibold text-text-main">
                Set as default role
              </span>
              <span className="text-xs text-text-muted">
                New invited members get this role
              </span>
            </label>
          </div>
        </div>

        {/* Permissions Card */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-premium animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">
              Access rights
            </h2>
          </div>

          <div className="divide-y divide-border/80">
            {PERMISSION_BLOCKS.map((block) => {
              const ruleIds = block.rules.map((r) => r.id);
              const allChecked = ruleIds.every((id) => selectedPermissions[id]);
              const someChecked = ruleIds.some((id) => selectedPermissions[id]);

              return (
                <div key={block.id}>
                  {/* Block header */}
                  <div className="px-6 py-4 bg-surface-hover/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked;
                      }}
                      onChange={() => toggleBlock(ruleIds)}
                      disabled={false}
                      className="w-4 h-4 rounded accent-indigo-600 disabled:opacity-60"
                    />
                    <div>
                      <span className="text-sm font-bold text-text-main">
                        {block.title}
                      </span>
                      <span className="text-xs text-text-muted ml-2">
                        {block.description}
                      </span>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="divide-y divide-border/40">
                    {block.rules.map((rule) => (
                      <label
                        key={rule.id}
                        className="flex items-start gap-3 px-6 py-2.5 transition-colors cursor-pointer hover:bg-indigo-50/30"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedPermissions[rule.id]}
                          onChange={() => togglePermission(rule.id)}
                          className="w-4 h-4 rounded accent-indigo-600 mt-0.5 shrink-0"
                        />
                        <div className="flex items-baseline gap-3 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-text-main w-44 shrink-0">
                            {rule.name}
                          </span>
                          <span className="text-sm text-text-muted truncate">
                            {rule.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium hover:-translate-y-0.5 transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            style={{ background: "var(--primary)" }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
          <Link
            href="/workspace/roles"
            className="px-5 py-2.5 text-[13px] font-bold text-text-muted bg-surface-hover hover:bg-surface-hover/80 rounded-xl transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
