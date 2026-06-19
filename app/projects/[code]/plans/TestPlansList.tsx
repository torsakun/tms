"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Search,
  Filter,
  PlayCircle,
  MoreHorizontal,
  FileText,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";

interface TestPlan {
  id: string;
  title: string;
  description: string | null;
  createdAt: string | Date;
  _count?: {
    testCases: number;
    testRuns: number;
  };
}

interface TestPlansListProps {
  initialPlans: TestPlan[];
  code: string;
}

export function TestPlansList({ initialPlans, code }: TestPlansListProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<TestPlan[]>(initialPlans);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and sort plans
  const filteredPlans = plans
    .filter(
      (plan) =>
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.description &&
          plan.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  const handleDelete = async (planId: string) => {
    const backup = [...plans];
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setActiveDropdown(null);

    try {
      const res = await fetch(`/api/projects/${code}/plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setPlans(backup);
        toast.error("Failed to delete test plan.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setPlans(backup);
      toast.error("An error occurred while deleting the test plan.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-2.5 text-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Search test plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] font-semibold border border-border/80 bg-surface text-text-main rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-inner transition-all hover:border-text-muted/40"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center text-[13px] font-bold px-4 py-2.5 rounded-xl transition-all duration-300 border border-border/80 shadow-sm ${showFilters ? "bg-surface-hover text-text-main" : "bg-surface text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
            >
              <Filter size={14} className="mr-2" />
              Sort: {sortBy === "newest" ? "Newest first" : "Oldest first"}
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-surface border border-border/80 rounded-2xl shadow-premium z-20 py-2 overflow-hidden animate-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${sortBy === "newest" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}
                >
                  Newest first
                </button>
                <button
                  onClick={() => {
                    setSortBy("oldest");
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${sortBy === "oldest" ? "bg-primary/10 text-primary font-medium" : "text-text-muted hover:bg-surface-hover"}`}
                >
                  Oldest first
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl shadow-premium border border-border/80 transition-all duration-300 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">
            No Test Plans found
          </h3>
          <p className="text-text-muted text-center max-w-sm mb-6 text-sm">
            Create a test plan to group test cases together. You can use test
            plans to create runs faster.
          </p>
          <Link
            href={`/projects/${code}/plans/create`}
            className="bg-primary text-primary-foreground shadow-premium px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300"
          >
            Create new plan
          </Link>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-2xl shadow-premium border border-border/80 transition-all duration-300 animate-in zoom-in-95">
          <p className="text-text-muted mb-2">
            No test plans match your search.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-primary hover:underline text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl shadow-premium border border-border/80 overflow-visible transition-all duration-300 animate-in zoom-in-95">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-hover/70">
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider w-1/3">
                  Title
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">
                  Cases
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">
                  Runs
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {filteredPlans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-surface-hover transition-colors group"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/projects/${code}/plans/${plan.id}`}
                      className="font-semibold text-[15px] text-text-main hover:text-primary block transition-colors"
                    >
                      {plan.title}
                    </Link>
                    {plan.description && (
                      <div className="text-sm text-text-muted mt-1 line-clamp-1">
                        {plan.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-background/50 border border-border/80 text-text-main">
                      {plan._count?.testCases || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-text-main">
                      {plan._count?.testRuns || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1.5 opacity-70" />
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/projects/${code}/runs/create?plan=${plan.id}`}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 flex items-center opacity-0 group-hover:opacity-100 hover:shadow-sm hover:-translate-y-0.5"
                      >
                        <PlayCircle size={14} className="mr-1.5" /> Start run
                      </Link>

                      <div
                        className="relative"
                        ref={activeDropdown === plan.id ? dropdownRef : null}
                      >
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === plan.id ? null : plan.id,
                            )
                          }
                          className={`p-1.5 rounded-xl transition-all ${activeDropdown === plan.id ? "bg-surface-hover text-text-main" : "text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activeDropdown === plan.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-surface border border-border/80 rounded-xl shadow-premium py-1 z-30 overflow-hidden animate-in zoom-in-95 duration-200">
                            <Link
                              href={`/projects/${code}/plans/${plan.id}/edit`}
                              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center"
                            >
                              <Edit2
                                size={14}
                                className="mr-2 text-text-muted"
                              />{" "}
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setActiveDropdown(null);
                                setConfirmDeleteId(plan.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center transition-colors"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete test plan"
          message="This test plan will be permanently deleted. This action cannot be undone."
          onConfirm={() => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            handleDelete(id);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
