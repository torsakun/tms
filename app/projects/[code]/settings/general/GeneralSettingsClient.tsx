"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDirty = name !== project.name || description !== (project.description || "");

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

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.code}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`Project ${project.code} deleted`);
      setConfirmOpen(false);
      router.push("/projects");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete project");
      setDeleting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-[760px]">
      <div className="mb-[6px] text-[17px] font-semibold tracking-[-0.01em] text-text-main">General</div>
      <div className="text-[13.5px] text-text-muted mb-[22px]">Manage project details and status.</div>

      <div className="flex flex-col gap-[20px]">
        <div>
          <label className="block text-[12px] text-text-muted mb-[6px]">Project Name</label>
          <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="My Project"
              className="w-full bg-transparent outline-none text-text-main" 
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-text-muted mb-[6px]">Project Code</label>
          <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] text-text-muted font-mono cursor-not-allowed opacity-80">
            {project.code}
          </div>
          <div className="text-[11.5px] text-text-faint mt-[4px]">Project code cannot be changed after creation.</div>
        </div>

        <div>
          <label className="block text-[12px] text-text-muted mb-[6px]">Description</label>
          <div className="flex px-[12px] py-[10px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe this project's purpose…"
              rows={4}
              className="w-full bg-transparent outline-none text-text-main resize-none" 
            />
          </div>
        </div>
      </div>

      <div className="mt-[28px] flex justify-end gap-[9px]">
        <Button
          variant="ghost"
          onClick={() => { setName(project.name); setDescription(project.description || ""); }}
          disabled={!isDirty || saving}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || !isDirty}
          loading={saving}
        >
          {!saving && <Check size={18} />}
          Save changes
        </Button>
      </div>

      <div className="mt-[40px] pt-[30px] border-t border-border">
        <div className="mb-[6px] text-[15px] font-semibold text-danger">Danger Zone</div>
        <div className="text-[13px] text-text-muted mb-[16px]">
          {project.isArchived ? "Restore this project to make it active again." : "Archive this project to hide it from active lists."}
        </div>
        
        <div className="flex items-center justify-between p-[18px] border border-danger-border bg-surface rounded-[13px] shadow-sm">
          <div>
            <div className="text-[14px] font-semibold text-text-main">{project.isArchived ? "Restore project" : "Archive project"}</div>
          </div>
          <button 
            onClick={handleArchiveToggle}
            disabled={archiving}
            className={`h-[36px] px-[16px] rounded-[9px] text-[13px] font-semibold border flex items-center gap-[6px] transition-colors disabled:opacity-50 ${
              project.isArchived 
                ? 'border-pass text-pass hover:bg-pass-soft' 
                : 'border-danger-border text-danger hover:bg-danger-soft'
            }`}
          >
            {archiving ? <Loader2 size={18} className="animate-spin" /> : (project.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />)}
            {project.isArchived ? "Restore" : "Archive"}
          </button>
        </div>

        <div className="mt-[14px] flex items-center justify-between p-[18px] border border-danger-border bg-surface rounded-[13px] shadow-sm">
          <div>
            <div className="text-[14px] font-semibold text-text-main">Delete this project</div>
            <div className="text-[13px] text-text-muted mt-[2px]">Once you delete a project, there is no going back. Please be certain.</div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="h-[36px] px-[16px] rounded-[9px] text-[13px] font-semibold border border-danger-border text-danger hover:bg-danger-soft flex items-center gap-[6px] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Delete this project
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title={`Delete project ${project.code}?`}
          message="This permanently deletes the project and all its suites, cases, runs and results. This cannot be undone."
          confirmationText={project.code}
          confirmLabel={deleting ? "Deleting…" : "Delete this project"}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
