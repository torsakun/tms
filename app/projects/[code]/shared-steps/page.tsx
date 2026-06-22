"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function SharedStepsPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [sharedSteps, setSharedSteps] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setAction("");
    setExpectedResult("");
    setIsModalOpen(true);
  };

  const openEdit = (step: any) => {
    setEditingId(step.id);
    setTitle(step.title);
    setAction(step.action || "");
    setExpectedResult(step.expectedResult || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    const backup = sharedSteps;
    setSharedSteps((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/shared-steps/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast.success("Shared step deleted");
    } catch {
      setSharedSteps(backup);
      toast.error("Failed to delete shared step");
    }
  };

  useEffect(() => {
    fetch(`/api/projects/${projectCode}/shared-steps`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSharedSteps(data);
      })
      .catch(console.error);
  }, [projectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        editingId
          ? `/api/projects/${projectCode}/shared-steps/${editingId}`
          : `/api/projects/${projectCode}/shared-steps`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, action, expectedResult }),
        },
      );
      if (res.ok) {
        const saved = await res.json();
        setSharedSteps((prev) =>
          editingId
            ? prev.map((s) => (s.id === editingId ? saved : s))
            : [saved, ...prev],
        );
        setIsModalOpen(false);
        toast.success(editingId ? "Shared step updated" : "Shared step created");
      } else {
        toast.error("Failed to save shared step");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save shared step");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden transition-colors">
      <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center space-x-3">
          <Share2 className="text-text-muted" size={24} />
          <h1 className="text-2xl font-bold text-text-main">Shared Steps</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center transition-all duration-300 shadow-premium hover:-translate-y-0.5"
        >
          <Plus size={16} className="mr-2" /> Create shared step
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {sharedSteps.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border-2 border-border border-dashed shadow-sm">
            <Share2
              size={48}
              className="mx-auto text-text-muted opacity-50 mb-4"
            />
            <h3 className="text-lg font-medium text-text-main mb-2">
              No shared steps yet
            </h3>
            <p className="text-text-muted max-w-sm mx-auto mb-6 text-sm">
              Create reusable steps like "Login as Admin" to include in multiple
              test cases, saving you time when steps change.
            </p>
            <button
              onClick={openCreate}
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-premium hover:-translate-y-0.5"
            >
              Create shared step
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border/80 overflow-hidden shadow-premium animate-in zoom-in-95 duration-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 border-b border-border/80 text-text-muted">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Expected Result</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {sharedSteps.map((step) => (
                  <tr
                    key={step.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-main">
                      {step.title}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{step.action}</td>
                    <td className="px-6 py-4 text-text-muted">
                      {step.expectedResult || "-"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(step)}
                        className="p-1.5 text-text-muted hover:text-text-main transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(step.id)}
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
          <div className="bg-surface w-[600px] rounded-3xl shadow-premium overflow-hidden border border-border/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border/80 flex justify-between items-center bg-surface-hover/50">
              <h3 className="text-lg font-bold text-text-main">
                {editingId ? "Edit shared step" : "Create shared step"}
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
                    className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                    placeholder="e.g. Login as Administrator"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                      Action <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main min-h-[100px]"
                      placeholder="1. Enter email..."
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                      Expected Result
                    </label>
                    <textarea
                      value={expectedResult}
                      onChange={(e) => setExpectedResult(e.target.value)}
                      className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main min-h-[100px]"
                      placeholder="User is logged in..."
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-background/50 border-t border-border/80 flex justify-end space-x-3">
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
          title="Delete shared step"
          message="This shared step will be permanently deleted. Test cases referencing it keep their own steps."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
