"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateRolePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Role title and description are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const activePermissions = Object.entries(selectedPermissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const res = await fetch("/api/workspace/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isDefault,
          permissions: activePermissions
        })
      });

      if (res.ok) {
        router.push("/workspace/roles");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create role");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBlock = (ruleIds: string[]) => {
    setSelectedPermissions(prev => {
      const allChecked = ruleIds.every(id => prev[id]);
      const newState = { ...prev };
      ruleIds.forEach(id => {
        newState[id] = !allChecked;
      });
      return newState;
    });
  };

  // We could use a state object to track all permissions, but for UI mockup we just need the structure.
  
  const permissionBlocks = [
    {
      id: "test-cases",
      title: "Test cases",
      description: "This block contains rules which allow to manage test cases.",
      rules: [
        { id: "tc-repository", name: "Repository", desc: "This rule allows to view test cases in the test case repository." },
        { id: "tc-create", name: "Create/update", desc: "This rule allows to create or update test cases in the test case repository." },
        { id: "tc-remove", name: "Remove", desc: "This rule allows to delete a test case." },
        { id: "tc-sort", name: "Change sort order", desc: "This rule allows to drag and drop test cases on the repository page." },
        { id: "tc-approve", name: "Approve/Decline", desc: "This rule allows to approve or decline test case changes during the review process." },
        { id: "tc-rollback", name: "Rollback", desc: "This rule allows to undo changes done to test cases." },
        { id: "tc-mute", name: "Mute/Unmute", desc: "This rule allows to mute or unmute a test case." },
      ]
    },
    {
      id: "dashboards",
      title: "Dashboards",
      description: "This block contains rules which allow to manage dashboards.",
      rules: [
        { id: "db-view", name: "View", desc: "This rule allows you to view existing dashboards." },
        { id: "db-create", name: "Create", desc: "This rule allows you to create dashboards, update, and remove them." },
        { id: "db-update", name: "Update", desc: "This rule allows to update any dashboards." },
        { id: "db-remove", name: "Remove", desc: "This rule allows to delete any dashboards." },
      ]
    },
    {
      id: "defects",
      title: "Defects",
      description: "This block contains rules which allow to manage defects.",
      rules: [
        { id: "df-view", name: "View", desc: "This rule allows to view a list of existing defects." },
        { id: "df-create", name: "Create/update", desc: "This rule allows to create or update defects." },
        { id: "df-remove", name: "Remove", desc: "This rule allows to delete defects." },
        { id: "df-resolve", name: "Resolve", desc: "This rule allows to resolve open defects." },
      ]
    },
    {
      id: "environments",
      title: "Environments",
      description: "This block contains rules which allow to manage environments.",
      rules: [
        { id: "env-view", name: "View", desc: "This rule allows to view a list of existing environments." },
        { id: "env-create", name: "Create/update", desc: "This rule allows to create or update environments." },
        { id: "env-remove", name: "Remove", desc: "This rule allows to delete environments." },
      ]
    },
    {
      id: "fields",
      title: "Fields",
      description: "This block contains rules which allow to manage fields.",
      rules: [
        { id: "fld-view", name: "View", desc: "This rule allows to view a list of existing fields." },
        { id: "fld-update", name: "Update", desc: "This rule allows to update fields." },
        { id: "fld-create", name: "Create", desc: "This rule allows to create custom fields." },
        { id: "fld-remove", name: "Remove", desc: "This rule allows to delete custom fields." },
      ]
    },
    {
      id: "test-plans",
      title: "Test plans",
      description: "This block contains rules which allow to manage test plans.",
      rules: [
        { id: "tp-view", name: "View", desc: "This rule allows to view a list of existing test plans." },
        { id: "tp-create", name: "Create/update", desc: "This rule allows to create or update test plans." },
        { id: "tp-remove", name: "Remove", desc: "This rule allows to delete test plans." },
      ]
    },
    {
      id: "projects",
      title: "Projects",
      description: "This block contains rules which allow to manage projects.",
      rules: [
        { id: "prj-create", name: "Create/update", desc: "This rule allows to create new projects and update their settings." },
        { id: "prj-remove", name: "Remove", desc: "This rule allows to delete and archive projects." },
        { id: "prj-access", name: "Access control", desc: "This rule allows to manage access to the project: add or remove members." },
        { id: "prj-owner", name: "Change ownership", desc: "This rule allows to change the project owner." },
        { id: "prj-import", name: "Import", desc: "This rule allows to import test cases from various sources." },
        { id: "prj-export", name: "Export", desc: "This rule allows to export test cases." },
      ]
    },
    {
      id: "test-runs",
      title: "Test runs",
      description: "This block contains rules which allow to manage test runs.",
      rules: [
        { id: "tr-view", name: "View", desc: "This rule allows to view a list of existing test runs." },
        { id: "tr-create", name: "Create/update", desc: "This rule allows to create or update test runs." },
        { id: "tr-remove", name: "Remove", desc: "This rule allows to delete test runs." },
        { id: "tr-submit", name: "Submit results", desc: "This rule allows to submit run results." },
        { id: "tr-assign", name: "Assign", desc: "This rule allows to set assignee." },
        { id: "tr-config", name: "Manage configurations", desc: "This rule allows to create, update, or delete configurations." },
      ]
    },
    {
      id: "test-suites",
      title: "Test suites",
      description: "This block contains rules which allow to manage test suites.",
      rules: [
        { id: "ts-create", name: "Create/update", desc: "This rule allows to create or update test suites." },
        { id: "ts-remove", name: "Remove", desc: "This rule allows to delete test suites and move their content to another suite." },
        { id: "ts-position", name: "Change suite position", desc: "This rule allows to drag and drop test suites on the repository page." },
      ]
    },
    {
      id: "tags",
      title: "Tags",
      description: "This block contains rules which allow to manage tags.",
      rules: [
        { id: "tg-view", name: "View", desc: "This rule allows to view a list of existing tags in the workspace." },
        { id: "tg-create", name: "Create/update", desc: "This rule allows to create tags on the fly." },
        { id: "tg-remove", name: "Remove", desc: "This rule allows to delete tags in the workspace." },
      ]
    },
    {
      id: "workspace",
      title: "Workspace",
      description: "This block contains rules which allow to manage workspace.",
      rules: [
        { id: "ws-update", name: "Update settings", desc: "This rule allows to update workspace settings." },
        { id: "ws-invite", name: "Invite", desc: "This rule allows to invite new members to the workspace." },
        { id: "ws-activate", name: "Activate/deactivate", desc: "This rule allows to activate or deactivate workspace users." },
        { id: "ws-user-update", name: "Workspace user update", desc: "This rule allows to change user details and roles." },
        { id: "ws-users-view", name: "Users view", desc: "This rule allows to view users." },
        { id: "ws-logs", name: "Logs", desc: "This rule allows to view logs." },
      ]
    }
  ];

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 border-b border-border shrink-0">
        <div className="flex items-center text-text-main">
          <Link href="/workspace/roles" className="mr-4 text-text-muted hover:text-text-muted transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Create Role</h1>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Role Settings */}
          <section>
            <h2 className="text-xl font-bold text-text-main mb-4 pb-2 border-b border-border">
              Role settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text-main mb-2">
                  Role title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-text-muted rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-main mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-text-muted rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input 
                      type="checkbox" 
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-text-muted rounded peer-checked:bg-primary peer-checked:border-blue-600 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm font-bold text-text-main">Set as default role</span>
                </label>
              </div>
            </div>
          </section>

          {/* Role access rights */}
          <section>
            <h2 className="text-xl font-bold text-text-main mb-6 pb-2 border-b border-border">
              Role access rights
            </h2>
            
            <div className="space-y-6">
              {permissionBlocks.map((block) => (
                <div key={block.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Block Header */}
                  <label className="bg-surface-hover px-4 py-3 flex items-start border-b border-border cursor-pointer">
                    <div className="relative flex items-center justify-center w-4 h-4 mt-1 mr-4 shrink-0">
                      <input 
                        type="checkbox" 
                        className="peer sr-only" 
                        checked={block.rules.length > 0 && block.rules.every(r => selectedPermissions[r.id])}
                        onChange={() => toggleBlock(block.rules.map(r => r.id))}
                      />
                      <div className="w-4 h-4 border border-text-muted rounded peer-checked:bg-primary peer-checked:border-blue-600 transition-colors"></div>
                      <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-main">{block.title}</h3>
                      <p className="text-sm text-text-muted mt-0.5">{block.description}</p>
                    </div>
                  </label>

                  {/* Rules List */}
                  <div className="bg-surface divide-y divide-slate-100">
                    {block.rules.map((rule) => (
                      <label key={rule.id} className="px-4 py-3 flex items-start hover:bg-surface-hover transition-colors cursor-pointer">
                        <div className="relative flex items-center justify-center w-4 h-4 mt-0.5 mr-4 shrink-0">
                          <input 
                            type="checkbox" 
                            className="peer sr-only" 
                            checked={!!selectedPermissions[rule.id]}
                            onChange={() => togglePermission(rule.id)}
                          />
                          <div className="w-4 h-4 border border-text-muted rounded peer-checked:bg-primary peer-checked:border-blue-600 transition-colors"></div>
                          <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-4">
                          <div className="col-span-4 sm:col-span-3">
                            <span className="text-sm font-bold text-text-main">{rule.name}</span>
                          </div>
                          <div className="col-span-8 sm:col-span-9">
                            <span className="text-sm text-text-muted">{rule.desc}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Form Actions */}
            <div className="mt-10 pt-6 border-t border-border flex items-center space-x-4">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#2563eb] hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
              <Link href="/workspace/roles" className="px-6 py-2 bg-surface border border-text-muted text-text-main hover:bg-surface-hover text-sm font-medium rounded-md transition-colors">
                Cancel
              </Link>
            </div>
            
          </section>
        </div>
      </div>
    </div>
  );
}
