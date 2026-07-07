"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Server,
  Pencil,
  Trash2,
  Cloud,
  Cloudy,
  Terminal,
  Code,
  Check,
} from "lucide-react";

export default function EnvironmentsPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [environments, setEnvironments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEnvironments = () => {
    fetch(`/api/projects/${projectCode}/environments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEnvironments(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchEnvironments();
  }, [projectCode]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSlug("");
    setIsDrawerOpen(true);
  };

  const openEdit = (env: any) => {
    setEditingId(env.id);
    setTitle(env.title);
    setDescription(env.description || "");
    setSlug(env.slug || "");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/projects/${projectCode}/environments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Environment deleted");
      fetchEnvironments();
    } catch {
      toast.error("Failed to delete environment");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(
        editingId
          ? `/api/projects/${projectCode}/environments/${editingId}`
          : `/api/projects/${projectCode}/environments`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, slug }),
        }
      );
      if (res.ok) {
        setIsDrawerOpen(false);
        toast.success(editingId ? "Environment updated" : "Environment created");
        fetchEnvironments();
      } else {
        toast.error("Failed to save environment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save environment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnvIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('prod')) return { Icon: Cloud, bg: 'var(--fail-soft)', color: 'var(--fail)' };
    if (n.includes('stag')) return { Icon: Cloudy, bg: 'var(--warn-soft)', color: 'var(--warn)' };
    if (n.includes('ci')) return { Icon: Terminal, bg: 'var(--surface-2)', color: 'var(--text-muted)' };
    return { Icon: Code, bg: 'var(--info-soft-fill)', color: 'var(--info)' };
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[840px] mx-auto p-[20px_22px] antialiased font-sans">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">Environments</div>
          <div className="text-[13px] text-text-muted mt-[2px]">Targets that test runs execute against</div>
        </div>
        <div className="flex-1" />
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={16} />
          Add environment
        </Button>
      </div>

      {environments.length === 0 ? (
        <div className="flex flex-col items-center p-[40px] text-center border border-dashed border-[var(--border-strong)] rounded-[13px] bg-surface mt-[20px]">
          <Server size={32} className="text-text-muted mb-2" />
          <div className="text-[15px] font-semibold text-text-main">No environments yet</div>
          <div className="text-[13px] text-text-muted mt-[4px]">Create test environments to specify where tests are executed.</div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
          {environments.map((e) => {
            const { Icon, bg, color } = getEnvIcon(e.title);
            return (
              <div key={e.id} className="flex items-center gap-[13px] p-[14px_18px] border-b border-border last:border-0 hover:bg-surface-hover transition-colors group">
                <div
                  className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0"
                  style={{ background: bg, color: color }}
                >
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-text-main">{e.title}</div>
                  <div className="text-[12px] text-text-muted mt-[1px]">{e.description || e.slug || "No description"}</div>
                </div>

                <div className="flex gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(e)} className="w-[32px] h-[32px] rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(e.id)} className="w-[32px] h-[32px] rounded-lg flex items-center justify-center text-text-faint hover:bg-danger-soft hover:text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[70px]" style={{ background: "color(display-p3 0 0 0 / 0.4)" }} onClick={() => setIsDrawerOpen(false)}>
          <div 
            className="w-[400px] bg-surface border border-border rounded-[15px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-[10px] p-[18px_20px_0]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-soft text-primary flex items-center justify-center">
                <Server size={19} />
              </div>
              <div className="text-[15.5px] font-semibold text-text-main">
                {editingId ? "Edit environment" : "Add environment"}
              </div>
            </div>

            <div className="p-[16px_20px] flex flex-col gap-[14px]">
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Pre-production"
                  className="qm-input w-full h-[40px] px-[13px] text-[13.5px] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Slug (Optional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. prod"
                  className="qm-input w-full h-[40px] px-[13px] font-mono text-[12px] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mirror of production for final validation."
                  className="qm-input w-full p-[10px_13px] text-[13px] min-h-[50px] resize-none leading-[1.5] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-[9px] p-[14px_20px] border-t border-border bg-surface">
              <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                <Check size={16} />
                {editingId ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this environment? Runs using it will keep their data but lose the link."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
