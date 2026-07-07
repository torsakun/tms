"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Flag,
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Check,
} from "lucide-react";

export default function MilestonesPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMilestones = () => {
    fetch(`/api/projects/${projectCode}/milestones`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMilestones(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectCode]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setIsDrawerOpen(true);
  };

  const openEdit = (ms: any) => {
    setEditingId(ms.id);
    setTitle(ms.title);
    setDescription(ms.description || "");
    setDueDate(ms.dueDate ? new Date(ms.dueDate).toISOString().slice(0, 10) : "");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/projects/${projectCode}/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Milestone deleted");
      fetchMilestones();
    } catch {
      toast.error("Failed to delete milestone");
    }
  };

  const handleToggleStatus = async (ms: any) => {
    const nextStatus = ms.status === "COMPLETED" ? "OPEN" : "COMPLETED";
    try {
      const res = await fetch(`/api/projects/${projectCode}/milestones/${ms.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(nextStatus === "COMPLETED" ? "Milestone completed" : "Milestone reopened");
      fetchMilestones();
    } catch {
      toast.error("Failed to update milestone status");
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
          ? `/api/projects/${projectCode}/milestones/${editingId}`
          : `/api/projects/${projectCode}/milestones`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, dueDate }),
        }
      );
      if (res.ok) {
        setIsDrawerOpen(false);
        toast.success(editingId ? "Milestone updated" : "Milestone created");
        fetchMilestones();
      } else {
        toast.error("Failed to save milestone");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMilestoneStyle = (status: string) => {
    if (status === "COMPLETED") return { Icon: CheckCircle2, iconColor: 'var(--pass)', bg: 'var(--pass-soft)', color: 'var(--pass)' };
    return { Icon: Flag, iconColor: 'var(--primary-text)', bg: 'var(--primary-soft)', color: 'var(--primary-text)' };
  };

  const getMilestoneMetrics = (milestone: any) => {
    const runs = Array.isArray(milestone.testRuns) ? milestone.testRuns : [];
    const results = runs.flatMap((run: any) => Array.isArray(run.results) ? run.results : []);
    const total = results.length;
    const completed = results.filter((result: any) => result.status !== "IN_PROGRESS").length;
    const passed = results.filter((result: any) => result.status === "PASSED").length;
    return {
      runCount: runs.length,
      completion: total ? Math.round((completed / total) * 100) : 0,
      passRate: completed ? Math.round((passed / completed) * 100) : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto p-[20px_22px] antialiased font-sans">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">Milestones</div>
          <div className="text-[13px] text-text-muted mt-[2px]">Track quality goals against release dates</div>
        </div>
        <div className="flex-1" />
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={16} />
          Create milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="p-[40px] text-center border border-dashed border-border-strong rounded-[13px] bg-surface mt-[20px]">
          <Flag size={32} className="text-text-muted mb-2 mx-auto" />
          <div className="text-[15px] font-semibold text-text-main">No milestones yet</div>
          <div className="text-[13px] text-text-muted mt-[4px]">Create milestones to group your test runs into Sprints or Releases.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {milestones.map((m) => {
            const st = getMilestoneStyle(m.status);
            const { runCount, passRate, completion } = getMilestoneMetrics(m);
            const passColor = passRate >= 90 ? 'var(--pass)' : passRate >= 75 ? 'var(--warn)' : 'var(--fail)';
            const formattedDate = m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';
            
            return (
              <div key={m.id} className="bg-surface border border-border rounded-[13px] p-[16px_18px] shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-[12px] mb-[13px]">
                  <st.Icon size={20} style={{ color: st.iconColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-text-main">{m.title}</div>
                    <div className="text-[11.5px] text-text-faint mt-[1px] flex items-center gap-[5px]">
                      <Calendar size={14} />
                      {formattedDate} · {runCount ? `${runCount} run${runCount === 1 ? "" : "s"}` : "No runs"}
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-[5px] text-[11px] font-bold p-[3px_10px] rounded-full uppercase tracking-wider"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {m.status === "COMPLETED" ? "Completed" : "Open"}
                  </span>

                  <div className="relative group/menu">
                    <button className="flex items-center justify-center text-text-faint hover:text-text-main p-1 rounded transition-colors">
                      <MoreHorizontal size={19} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-[9px] shadow-sm opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                      <button 
                        onClick={() => handleToggleStatus(m)}
                        className="w-full text-left px-3 py-1.5 text-[12.5px] text-text-main hover:bg-surface-hover transition-colors"
                      >
                        {m.status === "COMPLETED" ? "Reopen" : "Complete"}
                      </button>
                      <button 
                        onClick={() => openEdit(m)}
                        className="w-full text-left px-3 py-1.5 text-[12.5px] text-text-main hover:bg-surface-hover transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="w-full text-left px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger-soft transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-[14px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-text-faint mb-[5px]">
                      <span>Completion</span>
                      <span className="font-semibold text-text-muted tabular-nums">{completion}%</span>
                    </div>
                    <div className="h-[7px] rounded-[4px] bg-surface-2 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-text-faint mb-[5px]">
                      <span>Pass rate</span>
                      <span className="font-semibold tabular-nums" style={{ color: passColor }}>{passRate}%</span>
                    </div>
                    <div className="h-[7px] rounded-[4px] bg-surface-2 overflow-hidden">
                      <div className="h-full" style={{ width: `${passRate}%`, background: passColor }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[60px]" style={{ background: "color(display-p3 0 0 0 / 0.4)" }} onClick={() => setIsDrawerOpen(false)}>
          <div 
            className="w-[420px] bg-surface border border-border rounded-[15px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-[10px] p-[18px_20px_0]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-soft text-primary-text flex items-center justify-center">
                <Flag size={19} />
              </div>
              <div className="text-[15.5px] font-semibold text-text-main">
                {editingId ? "Edit milestone" : "New milestone"}
              </div>
            </div>
            
            <div className="p-[16px_20px] flex flex-col gap-[14px]">
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. v5.0 release"
                  className="qm-input w-full h-[40px] px-[13px] text-[13.5px] focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Due date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="qm-input w-full h-[40px] pl-[13px] pr-[38px] text-[13.5px] focus:ring-2 focus:ring-[var(--ring)]"
                  />
                  <Calendar size={18} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Major release goals."
                  className="qm-input w-full p-[10px_13px] text-[13px] min-h-[54px] resize-none leading-[1.5] focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-[9px] p-[14px_20px] border-t border-border bg-surface">
              <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting}>
                {!isSubmitting && <Check size={16} />}
                {editingId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this milestone? Linked runs will keep their data."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
