"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Settings, Trash2, Flag } from "lucide-react";

export default function MilestonesPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${projectCode}/milestones`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMilestones(data);
      })
      .catch(console.error);
  }, [projectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectCode}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate }),
      });
      if (res.ok) {
        const newMs = await res.json();
        setMilestones([newMs, ...milestones]);
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden transition-colors">
      <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center space-x-3">
          <Flag className="text-text-muted" size={24} />
          <h1 className="text-2xl font-bold text-text-main">Milestones</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all duration-300 flex items-center shadow-premium hover:-translate-y-0.5"
        >
          <Plus size={16} className="mr-2" /> Create milestone
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {milestones.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border/80 border-dashed animate-in zoom-in-95 duration-200">
            <Flag
              size={48}
              className="mx-auto text-text-muted opacity-50 mb-4"
            />
            <h3 className="text-lg font-medium text-text-main mb-2">
              No milestones yet
            </h3>
            <p className="text-text-muted max-w-sm mx-auto mb-6 text-sm">
              Create milestones to group your test runs into Sprints, Releases,
              or specific test cycles.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-primary-hover transition-all duration-300 shadow-premium hover:-translate-y-0.5"
            >
              Create milestone
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border/80 shadow-premium overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/70 border-b border-border/80 text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {milestones.map((ms) => (
                  <tr
                    key={ms.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-main">
                      {ms.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${ms.status === "OPEN" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"}`}
                      >
                        {ms.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {ms.dueDate
                        ? new Date(ms.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-1.5 text-text-muted hover:text-text-main transition-colors">
                        <Settings size={16} />
                      </button>
                      <button className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
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
            <div className="px-6 py-4 border-b border-border/80 flex justify-between items-center bg-background/50">
              <h3 className="text-lg font-bold text-text-main">
                Create milestone
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
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                    placeholder="e.g. Sprint 14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main min-h-[100px]"
                    placeholder="Goals for this milestone..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-background/50 border-t border-border/80 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border/80 text-[13px] font-bold hover:bg-surface-hover text-text-main transition-colors hover:border-text-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-[13px] font-bold shadow-premium transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
