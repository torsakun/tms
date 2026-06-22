"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Box } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function EnvironmentsPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [environments, setEnvironments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSlug("");
    setIsModalOpen(true);
  };

  const openEdit = (env: any) => {
    setEditingId(env.id);
    setTitle(env.title);
    setDescription(env.description || "");
    setSlug(env.slug || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    const backup = environments;
    setEnvironments((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/environments/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast.success("Environment deleted");
    } catch {
      setEnvironments(backup);
      toast.error("Failed to delete environment");
    }
  };

  useEffect(() => {
    fetch(`/api/projects/${projectCode}/environments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEnvironments(data);
      })
      .catch(console.error);
  }, [projectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        editingId
          ? `/api/projects/${projectCode}/environments/${editingId}`
          : `/api/projects/${projectCode}/environments`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, slug }),
        },
      );
      if (res.ok) {
        const saved = await res.json();
        setEnvironments((prev) =>
          editingId
            ? prev.map((e) => (e.id === editingId ? saved : e))
            : [saved, ...prev],
        );
        setIsModalOpen(false);
        toast.success(editingId ? "Environment updated" : "Environment created");
      } else {
        toast.error("Failed to save environment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save environment");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden transition-colors">
      <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center space-x-3">
          <Box className="text-text-muted" size={24} />
          <h1 className="text-2xl font-bold text-text-main">Environments</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center transition-all duration-300 shadow-premium hover:-translate-y-0.5"
        >
          <Plus size={16} className="mr-2" /> Create environment
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {environments.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border-2 border-border border-dashed shadow-sm">
            <Box
              size={48}
              className="mx-auto text-text-muted opacity-50 mb-4"
            />
            <h3 className="text-lg font-medium text-text-main mb-2">
              No environments yet
            </h3>
            <p className="text-text-muted max-w-sm mx-auto mb-6 text-sm">
              Create test environments (like Staging, Production, iOS, Android)
              to specify where your tests are executed.
            </p>
            <button
              onClick={openCreate}
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-premium hover:-translate-y-0.5"
            >
              Create environment
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl shadow-premium border border-border/80 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 border-b border-border text-text-muted">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {environments.map((env) => (
                  <tr
                    key={env.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-main">
                      {env.title}
                    </td>
                    <td className="px-6 py-4 text-text-muted font-mono text-xs">
                      {env.slug}
                    </td>
                    <td className="px-6 py-4 text-text-muted truncate max-w-xs">
                      {env.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(env)}
                        className="p-1.5 text-text-muted hover:text-text-main transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(env.id)}
                        className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[500px] rounded-2xl shadow-premium overflow-hidden border border-border/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border/80 flex justify-between items-center bg-surface-hover/50">
              <h3 className="text-lg font-bold text-text-main">
                {editingId ? "Edit environment" : "Create environment"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-main transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border/80 text-text-main rounded-xl px-4 py-2.5 text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
                    placeholder="e.g. Production"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-background border border-border/80 text-text-main rounded-xl px-4 py-2.5 text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
                    placeholder="e.g. prod (optional)"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-border/80 text-text-main rounded-xl px-4 py-2.5 text-[13px] font-semibold min-h-[100px] resize-none focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
                    placeholder="Brief description of the environment..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-background border-t border-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border/80 text-[13px] font-bold hover:border-text-muted/40 hover:bg-surface-hover text-text-main transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-[13px] font-bold shadow-premium transition-all duration-300 hover:-translate-y-0.5"
                >
                  {editingId ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete environment"
          message="This environment will be permanently deleted. Runs using it will keep their data but lose the link."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
