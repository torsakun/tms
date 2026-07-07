"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowDownUp,
  Plus,
  Play,
  Pencil,
  MoreHorizontal,
  GripVertical,
  BadgeCheck,
  BookOpen,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ButtonLink, Button } from "@/components/ui/Button";

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

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="max-w-[1120px] mx-auto p-[20px_22px]">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">
            Test plans
          </div>
          <div className="text-[13px] text-text-muted mt-[2px]">
            Curated sets of cases you run together each cycle
          </div>
        </div>
        <div className="flex-1" />

        <div className="flex items-center gap-[8px] h-[36px] px-[11px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] rounded-[9px] text-[12.5px] min-w-[170px] focus-within:shadow-[inset_0_0_0_1px_var(--primary)] transition-shadow">
          <Search size={17} className="text-text-faint shrink-0" />
          <input
            type="text"
            placeholder="Search plans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-text-main placeholder:text-text-faint"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-[6px] h-[36px] px-[12px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] rounded-[9px] text-[12.5px] font-medium text-text-main hover:bg-surface-hover transition-colors"
          >
            <ArrowDownUp size={16} className="text-text-faint" />
            {sortBy === "newest" ? "Recent" : "Oldest"}
          </button>

          {showFilters && (
            <div className="absolute top-full mt-2 right-0 w-40 bg-surface border border-border rounded-[9px] shadow-md z-20 py-1">
              <button
                onClick={() => {
                  setSortBy("newest");
                  setShowFilters(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] ${sortBy === "newest" ? "bg-primary-light text-primary font-medium" : "text-text-muted hover:bg-surface-hover hover:text-text-main"}`}
              >
                Recent
              </button>
              <button
                onClick={() => {
                  setSortBy("oldest");
                  setShowFilters(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] ${sortBy === "oldest" ? "bg-primary-light text-primary font-medium" : "text-text-muted hover:bg-surface-hover hover:text-text-main"}`}
              >
                Oldest
              </button>
            </div>
          )}
        </div>

        <ButtonLink
          href={`/projects/${code}/plans/create`}
          variant="primary"
          size="md"
        >
          <Plus size={18} />
          Create test plan
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-[11px] mb-[28px]">
        {filteredPlans.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-[16px] bg-surface border border-border rounded-[13px] p-[15px_18px] shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            onClick={() => router.push(`/projects/${code}/plans/${p.id}`)}
          >
            <div className="w-[38px] h-[38px] rounded-[10px] bg-primary-light text-primary flex items-center justify-center shrink-0">
              <BadgeCheck size={21} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-text-main">
                {p.title}
              </div>
              <div className="text-[12.5px] text-text-muted mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                {p.description || "No description provided."}
              </div>
            </div>

            <div className="flex gap-[24px] shrink-0">
              <div className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-text-main">
                  {p._count?.testCases || 0}
                </div>
                <div className="text-[10.5px] text-text-faint">cases</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-text-main">
                  {p._count?.testRuns || 0}
                </div>
                <div className="text-[10.5px] text-text-faint">runs</div>
              </div>
              <div className="text-right w-[84px]">
                <div className="text-[12.5px] font-medium text-text-muted">
                  {formatDate(p.createdAt)}
                </div>
                <div className="text-[10.5px] text-text-faint">created</div>
              </div>
            </div>

            <div className="flex gap-[4px] shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${code}/runs/create?plan=${p.id}`);
                }}
                className="w-[32px] h-[32px] rounded-[8px] shadow-[inset_0_0_0_1px_var(--border-color)] flex items-center justify-center text-primary hover:bg-primary-light transition-colors"
                title="Start run"
              >
                <Play size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${code}/plans/${p.id}/edit`);
                }}
                className="w-[32px] h-[32px] rounded-[8px] shadow-[inset_0_0_0_1px_var(--border-color)] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                title="Edit"
              >
                <Pencil size={17} />
              </button>
              <div
                className="relative"
                ref={activeDropdown === p.id ? dropdownRef : null}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === p.id ? null : p.id);
                  }}
                  className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-text-faint hover:text-text-main hover:bg-surface-hover transition-colors"
                >
                  <MoreHorizontal size={18} />
                </button>
                {activeDropdown === p.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-surface border border-border shadow-md rounded-[9px] py-1 z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(null);
                        setConfirmDeleteId(p.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger-soft transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <>
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-text-faint mb-[8px]">
            Empty state
          </div>
          <div className="bg-surface border border-border rounded-[13px] shadow-sm p-[36px] flex items-center gap-[30px]">
            <div className="flex-1">
              <div className="text-[16px] font-semibold text-text-main">
                Plan a test cycle once, run it every release
              </div>
              <div className="text-[13px] text-text-muted m-[8px_0_16px] leading-[1.6] max-w-[420px]">
                A test plan bundles the cases that matter for a milestone —
                regression, smoke, release-candidate — so any tester can spin up
                a consistent run in one click.
              </div>
              <div className="flex gap-[9px]">
                <ButtonLink
                  href={`/projects/${code}/plans/create`}
                  variant="primary"
                  size="lg"
                >
                  <Plus size={20} />
                  Create test plan
                </ButtonLink>
                <Button variant="ghost" size="lg">
                  <BookOpen size={20} />
                  Learn more
                </Button>
              </div>
            </div>
            <div className="w-[200px] shrink-0 flex flex-col gap-[8px]">
              {["80%", "100%", "60%"].map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-[9px] p-[9px_11px] border border-dashed border-[var(--border-strong)] rounded-[9px]"
                >
                  <GripVertical size={16} className="text-text-faint" />
                  <div
                    className="h-[7px] rounded-[4px] bg-surface-hover"
                    style={{ width: w }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
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
