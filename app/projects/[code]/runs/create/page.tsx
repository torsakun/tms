"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { X, AlertCircle } from "lucide-react";
import { DUMMY_CASES, DUMMY_SUITES } from "@/types/repository";
import { TestCaseSelectionModal } from "@/components/runs/TestCaseSelectionModal";

import { Suspense } from "react";

function CreateRunContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const planId = searchParams.get("plan");

  const [title, setTitle] = useState(`Run: ${new Date().toLocaleDateString()}`);
  const [description, setDescription] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const [casesRes, suitesRes, envsRes, msRes] = await Promise.all([
          fetch(`/api/projects/${code}/cases`),
          fetch(`/api/projects/${code}/suites`),
          fetch(`/api/projects/${code}/environments`),
          fetch(`/api/projects/${code}/milestones`),
        ]);

        if (casesRes.ok && suitesRes.ok) {
          const casesData = await casesRes.json();
          const suitesData = await suitesRes.json();

          if (envsRes.ok) {
            const envsData = await envsRes.json();
            if (Array.isArray(envsData)) setEnvironments(envsData);
          }
          if (msRes.ok) {
            const msData = await msRes.json();
            if (Array.isArray(msData)) setMilestones(msData);
          }

          // Build tree from flat array
          const buildTree = (flatList: any[]) => {
            const map = new Map();
            const roots: any[] = [];
            flatList.forEach((item) => {
              map.set(item.id, { ...item, children: [] });
            });
            flatList.forEach((item) => {
              const node = map.get(item.id);
              if (item.parentId) {
                if (map.has(item.parentId)) {
                  map.get(item.parentId).children.push(node);
                } else {
                  roots.push(node);
                }
              } else {
                roots.push(node);
              }
            });
            return roots;
          };

          setCases(casesData);
          setSuites(buildTree(suitesData));

          if (planId) {
            // Fetch plan details to get selected cases
            try {
              const planRes = await fetch(
                `/api/projects/${code}/plans/${planId}`,
              );
              if (planRes.ok) {
                const planData = await planRes.json();
                setTitle(`Run: ${planData.title}`);
                setSelectedIds(
                  new Set((planData.testCases || []).map((c: any) => c.id)),
                );
              } else {
                setSelectedIds(new Set(casesData.map((c: any) => c.id)));
              }
            } catch (e) {
              setSelectedIds(new Set(casesData.map((c: any) => c.id)));
            }
          } else {
            setSelectedIds(new Set(casesData.map((c: any) => c.id)));
          }
        } else {
          throw new Error("Fallback");
        }
      } catch (err) {
        setCases([]);
        setSuites([]);
        setSelectedIds(new Set());
      }
    };
    fetchCases();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("Please select at least one test case.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          caseIds: Array.from(selectedIds),
          planId: planId || undefined,
          environmentId: selectedEnvId || undefined,
          milestoneId: selectedMilestoneId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create run");
      }

      const data = await res.json();
      router.push(`/projects/${code}/runs/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleModalSave = (newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background items-center justify-center p-8">
      <div className="bg-surface rounded-2xl shadow-premium border border-border/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/80 shrink-0 bg-surface">
          <h1 className="text-xl font-semibold text-text-main">
            Start new test run
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-8 space-y-6 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 flex items-center rounded-xl border border-red-100">
                <AlertCircle size={18} className="mr-2 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                Run Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border/80 text-text-main rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner placeholder:text-text-muted/50"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the goal of this test run?"
                className="w-full px-4 py-3 bg-surface border border-border/80 text-text-main rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner placeholder:text-text-muted/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                  Environment (Optional)
                </label>
                <select
                  value={selectedEnvId}
                  onChange={(e) => setSelectedEnvId(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border/80 text-text-main rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner"
                >
                  <option value="">No environment</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                  Milestone (Optional)
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border/80 text-text-main rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner"
                >
                  <option value="">No milestone</option>
                  {milestones.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Trigger */}
            <div className="pt-2">
              <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wider">
                Test Cases
              </label>
              <button
                type="button"
                className="flex items-center justify-between w-full px-5 py-4 bg-surface border border-border/80 rounded-xl hover:border-primary/50 hover:ring-4 hover:ring-primary/20 transition-all text-left group shadow-inner"
                onClick={() => setIsModalOpen(true)}
              >
                <div>
                  <div className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">
                    Select test cases
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {selectedIds.size === cases.length
                      ? "All test cases selected"
                      : `${selectedIds.size} of ${cases.length} cases selected`}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-background border border-border text-text-main rounded-md text-sm font-medium group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                  Edit selection
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-border/50 shrink-0 bg-surface">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-[13px] font-bold text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-all mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-5 py-2.5 text-[13px] font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-premium duration-300 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              {loading ? "Starting..." : "Start Run"}
            </button>
          </div>
        </form>
      </div>

      <TestCaseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        suites={suites}
        cases={cases}
        initialSelectedIds={selectedIds}
      />
    </div>
  );
}

export default function CreateRunPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRunContent />
    </Suspense>
  );
}
