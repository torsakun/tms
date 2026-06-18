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
              className="w-full pl-9 pr-4 py-2 text-sm border-none bg-surface text-text-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center text-sm px-4 py-2 rounded-md transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${showFilters ? "bg-surface-hover text-text-main" : "bg-surface text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
            >
              <Filter size={14} className="mr-2" />
              Sort: {sortBy === "newest" ? "Newest first" : "Oldest first"}
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-surface border-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-20 py-2 overflow-hidden">
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
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
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
            className="bg-primary text-primary-foreground shadow-sm px-5 py-2.5 rounded-md font-medium hover:bg-primary-hover transition-colors"
          >
            Create new plan
          </Link>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
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
        <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none overflow-visible transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-surface-hover">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-1/3">
                  Title
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">
                  Cases
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">
                  Runs
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-background border border-border text-text-main">
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
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded text-sm font-semibold transition-colors flex items-center opacity-0 group-hover:opacity-100"
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
                          className={`p-1.5 rounded transition-colors ${activeDropdown === plan.id ? "bg-surface-hover text-text-main" : "text-text-muted hover:text-text-main hover:bg-surface-hover"}`}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activeDropdown === plan.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-surface border-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] py-1 z-30 overflow-hidden">
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
