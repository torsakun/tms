"use client";

import { useState } from "react";
import { Loader2, Save, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isArchived: boolean;
}

export function GeneralSettingsClient({ project }: { project: Project }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isDirty =
    name !== project.name || description !== (project.description || "");

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Project settings saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    const action = project.isArchived ? "restore" : "archive";
    if (!confirm(`Are you sure you want to ${action} this project?`)) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/projects/${project.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !project.isArchived }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`Project ${action}d`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Basic info */}
      <section className="space-y-5">
        <div>
          <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="w-full px-4 py-3 border border-border/80 rounded-xl text-[13px] font-semibold bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
            Project Code
          </label>
          <input
            type="text"
            value={project.code}
            disabled
            className="w-full px-4 py-3 border border-border/80 rounded-xl text-[13px] font-semibold bg-surface-hover text-text-muted cursor-not-allowed"
          />
          <p className="text-sm text-text-muted mt-1.5">
            Project code cannot be changed after creation.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this project's purpose…"
            rows={4}
            className="w-full px-4 py-3 border border-border/80 rounded-xl text-[13px] font-semibold bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary resize-none transition-all shadow-inner hover:border-text-muted/40"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium transition-all hover:-translate-y-0.5 duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
            style={{ background: "var(--primary)" }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save changes
          </button>
        </div>
      </section>

      <hr className="border-border/80" />

      {/* Danger zone */}
      <section>
        <h2 className="text-[13px] font-bold text-red-600 mb-3 uppercase tracking-wider">Danger zone</h2>
        <div className="border border-red-200/80 rounded-2xl p-5 flex items-center justify-between bg-red-50/30 shadow-sm">
          <div>
            <div className="text-sm font-semibold text-text-main">
              {project.isArchived ? "Restore project" : "Archive project"}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {project.isArchived
                ? "Make this project active again."
                : "Archive this project to hide it from the active list."}
            </div>
          </div>
          <button
            onClick={handleArchiveToggle}
            disabled={archiving}
            className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-xl border transition-all duration-300 shadow-sm hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none ${
              project.isArchived
                ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                : "border-red-300 text-red-700 bg-surface hover:bg-red-50"
            }`}
          >
            {archiving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : project.isArchived ? (
              <RotateCcw size={14} />
            ) : (
              <Archive size={14} />
            )}
            {project.isArchived ? "Restore" : "Archive"}
          </button>
        </div>
      </section>
    </div>
  );
}
