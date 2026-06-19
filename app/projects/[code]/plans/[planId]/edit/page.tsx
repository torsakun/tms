"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { TestCaseSelectionModal } from "@/components/runs/TestCaseSelectionModal";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const planId = params.planId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, casesRes, suitesRes] = await Promise.all([
          fetch(`/api/projects/${code}/plans/${planId}`),
          fetch(`/api/projects/${code}/cases`),
          fetch(`/api/projects/${code}/suites`),
        ]);

        if (planRes.ok && casesRes.ok && suitesRes.ok) {
          const planData = await planRes.json();
          const casesData = await casesRes.json();
          const suitesData = await suitesRes.json();

          setTitle(planData.title || "");
          setDescription(planData.description || "");

          // Pre-select existing cases
          if (planData.testCases) {
            setSelectedIds(new Set(planData.testCases.map((c: any) => c.id)));
          }

          // Build tree from flat array for suites
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
        } else {
          throw new Error("Failed to load repository data.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load plan data.");
      } finally {
        setFetching(false);
      }
    };

    if (code && planId) {
      fetchData();
    }
  }, [code, planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("Please select at least one test case.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          caseIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plan");
      }

      router.push(`/projects/${code}/plans`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleModalSave = (newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
    setIsModalOpen(false);
  };

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-hover">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-hover items-center justify-center">
      <div className="bg-surface rounded-2xl border border-border/80 shadow-premium w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/80 shrink-0 bg-surface">
          <h1 className="text-xl font-semibold text-text-main">
            Edit test plan
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
                Plan Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Release 1.2 Regression"
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
                placeholder="What is the goal of this test plan?"
                className="w-full px-4 py-3 bg-surface border border-border/80 text-text-main rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner placeholder:text-text-muted/50"
              />
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

          <div className="flex justify-end p-6 border-t border-border shrink-0 bg-surface">
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
              {loading ? "Saving..." : "Save Changes"}
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
