"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Sparkles, Bug, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  runId: string;
  result: any | null;
  onReported?: (issue: any) => void;
}

const SEVERITIES = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"];

export function ReportBugModal({ isOpen, onClose, projectCode, runId, result, onReported }: ReportBugModalProps) {
  const [drafting, setDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("MAJOR");
  const [rootCause, setRootCause] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<string[]>([]);

  const draft = useCallback(async () => {
    if (!result) return;
    setDrafting(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/results/${result.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelProvider: "openai" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary || "");
        setSeverity(data.severity || "MAJOR");
        setRootCause(data.rootCause || "");
        setDescription(data.description || "");
        setSteps(Array.isArray(data.stepsToReproduce) ? data.stepsToReproduce : []);
      } else {
        toast.error(data.error || "AI draft failed");
        // Fall back to a basic prefill so user can still file manually
        setSummary(result.testCase?.title ? `[Bug] ${result.testCase.title}` : "");
        setDescription(result.errorMessage || result.comment || "");
        setSteps((result.testCase?.steps || []).map((s: any) => s.action));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error drafting bug");
    } finally {
      setDrafting(false);
    }
  }, [projectCode, runId, result]);

  useEffect(() => {
    if (isOpen && result) draft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, result?.id]);

  if (!isOpen || !result) return null;

  const updateStep = (i: number, v: string) => setSteps((s) => s.map((x, idx) => (idx === i ? v : x)));
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!summary.trim()) { toast.error("Summary is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/runs/${runId}/results/${result.id}/report-bug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, description, severity, stepsToReproduce: steps.filter((s) => s.trim()) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Created Jira bug ${data.issue.key}`);
        onReported?.(data.issue);
        onClose();
      } else {
        toast.error(data.error || "Failed to create bug");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating bug");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bug size={16} className="text-rose-500" />
            Report bug to Jira
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {drafting ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative">
              <Sparkles size={28} className="text-indigo-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-500">AI กำลังวิเคราะห์ failure และร่าง bug…</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1.5 rounded-lg w-fit">
              <Sparkles size={12} /> AI drafted — แก้ไขได้ก่อน submit
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Summary</label>
              <input value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {rootCause && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">AI root-cause hypothesis</div>
                <p className="text-sm text-amber-800">{rootCause}</p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} h-24 resize-none`} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Steps to reproduce</label>
                <button onClick={() => setSteps((s) => [...s, ""])} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
                    <input value={s} onChange={(e) => updateStep(i, e.target.value)} className={`${inputCls} py-1.5`} />
                    <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
                {steps.length === 0 && <p className="text-xs text-slate-400 italic">No steps</p>}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex justify-between items-center gap-3">
          <button onClick={draft} disabled={drafting || submitting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50">
            <Sparkles size={13} /> Re-draft
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={drafting || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Create Jira bug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
