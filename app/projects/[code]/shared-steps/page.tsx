"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  ListChecks,
  ChevronRight,
  GripVertical,
  Check,
  Trash2,
} from "lucide-react";

export default function SharedStepsPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [sharedSteps, setSharedSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchSharedSteps = useCallback(() => {
    fetch(`/api/projects/${projectCode}/shared-steps`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSharedSteps(data);
          if (data.length > 0 && !editingId) {
            handleEdit(data[0]);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [projectCode, editingId]);

  useEffect(() => {
    fetchSharedSteps();
  }, [fetchSharedSteps]);

  const handleCreateNew = () => {
    setEditingId("new");
    setTitle("New Shared Step");
    setAction("");
    setExpectedResult("");
  };

  const handleEdit = (step: any) => {
    setEditingId(step.id);
    setTitle(step.title);
    setAction(step.action || "");
    setExpectedResult(step.expectedResult || "");
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/projects/${projectCode}/shared-steps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Shared step deleted");
      if (editingId === id) {
        const rem = sharedSteps.filter(s => s.id !== id);
        if (rem.length > 0) handleEdit(rem[0]);
        else handleCreateNew();
      }
      fetchSharedSteps();
    } catch {
      toast.error("Failed to delete shared step");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !action.trim()) {
      toast.error("Title and action are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(
        editingId && editingId !== "new"
          ? `/api/projects/${projectCode}/shared-steps/${editingId}`
          : `/api/projects/${projectCode}/shared-steps`,
        {
          method: editingId && editingId !== "new" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, action, expectedResult }),
        }
      );
      if (res.ok) {
        toast.success(editingId && editingId !== "new" ? "Saved successfully" : "Created successfully");
        if (editingId === "new") {
          const data = await res.json();
          setEditingId(data.id || null);
        }
        fetchSharedSteps();
      } else {
        toast.error("Failed to save shared step");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save shared step");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto px-[22px] py-[20px] antialiased font-sans">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">Shared steps</div>
          <div className="text-[13px] text-text-muted mt-[2px]">Reusable step sequences referenced across cases</div>
        </div>
        <div className="flex-1" />
        <Button variant="primary" size="sm" onClick={handleCreateNew}>
          <Plus size={16} />
          New shared step
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-[16px] items-start">

        {/* list */}
        <div className="flex flex-col gap-[10px]">
          {sharedSteps.map((s) => {
            const isSelected = s.id === editingId;
            return (
              <div
                key={s.id}
                onClick={() => handleEdit(s)}
                className={`flex items-center gap-[12px] bg-surface border rounded-[12px] px-[16px] py-[13px] shadow-[var(--shadow-sm)] cursor-pointer hover:bg-surface-hover transition-colors group ${isSelected ? "border-[var(--primary)]" : "border-border"}`}
              >
                <div className="w-[34px] h-[34px] rounded-[9px] bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                  <ListChecks size={18} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-text-main truncate">{s.title}</div>
                  <div className="text-[11.5px] text-text-faint mt-[1px]">1 step · used in 0 cases</div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirmDeleteId(s.id)} className="text-text-faint hover:text-danger transition-colors" aria-label="Delete shared step">
                    <Trash2 size={17} />
                  </button>
                </div>
                <ChevronRight size={19} className="text-text-faint" />
              </div>
            );
          })}

          {sharedSteps.length === 0 && (
            <div className="p-[40px] text-center border border-dashed border-[var(--border-strong)] rounded-[13px] bg-surface">
              <ListChecks size={32} className="text-text-muted mb-2 mx-auto" />
              <div className="text-[14px] font-semibold text-text-main">No shared steps</div>
            </div>
          )}
        </div>

        {/* editor */}
        {(editingId || editingId === "new") && (
          <div className="bg-surface border border-border rounded-[13px] shadow-[var(--shadow-sm)] overflow-hidden sticky top-6">
            <div className="px-[16px] py-[14px] border-b border-border">
              <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-text-faint">
                {editingId === "new" ? "New shared step" : "Editing"}
              </div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Shared step title"
                className="qm-input w-full h-[38px] px-[12px] mt-[8px] text-[13.5px] font-semibold focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            <div className="px-[16px] pt-[6px] pb-[14px]">
              <div className="grid grid-cols-[30px_1fr_1fr_28px] gap-[10px] py-[9px] text-[10px] font-semibold tracking-[0.05em] uppercase text-text-faint">
                <div>#</div>
                <div>Action</div>
                <div>Expected</div>
                <div></div>
              </div>

              <div className="grid grid-cols-[30px_1fr_1fr_28px] gap-[10px] py-[9px] items-start border-t border-border">
                <div className="w-[22px] h-[22px] rounded-[6px] bg-[var(--surface-2)] flex items-center justify-center text-[11px] font-bold text-text-muted mt-2">1</div>
                <div>
                  <textarea
                    value={action}
                    onChange={e => setAction(e.target.value)}
                    placeholder="Describe action..."
                    className="qm-input w-full text-[12.5px] p-2 min-h-[60px] resize-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <div>
                  <textarea
                    value={expectedResult}
                    onChange={e => setExpectedResult(e.target.value)}
                    placeholder="Expected result..."
                    className="qm-input w-full text-[12.5px] p-2 min-h-[60px] resize-none text-text-muted focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <div className="flex justify-center text-text-faint mt-2">
                  <GripVertical size={17} />
                </div>
              </div>

              <div className="flex items-center gap-[7px] py-[10px] pb-[2px] border-t border-border text-[var(--primary-text)] text-[12.5px] font-semibold opacity-50 cursor-not-allowed">
                <Plus size={17} />Add step
              </div>
            </div>

            <div className="flex justify-end gap-[9px] px-[16px] py-[13px] border-t border-border bg-surface">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingId === "new") {
                    setEditingId(null);
                  } else {
                    const s = sharedSteps.find(x => x.id === editingId);
                    if (s) handleEdit(s);
                  }
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} loading={isSubmitting}>
                {!isSubmitting && <Check size={16} />}
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this shared step? Reference will be lost."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
