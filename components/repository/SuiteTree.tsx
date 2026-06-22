// components/repository/SuiteTree.tsx
"use client";
import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Suite } from "@/types/repository";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { useSuiteExpansion } from "@/components/providers/SuiteExpansionProvider";

interface SuiteItemProps {
  suite: any;
  level: number;
  projectCode: string;
  selectedSuiteId: string | null;
  onAddChild: (parentId: string) => void;
}

const SuiteItem = ({
  suite,
  level,
  projectCode,
  selectedSuiteId,
  onAddChild,
}: SuiteItemProps) => {
  const router = useRouter();
  const { role } = useProjectRole();
  const { isExpanded, toggleSuite } = useSuiteExpansion();
  const isOpen = isExpanded(suite.id);
  const hasChildren = suite.children && suite.children.length > 0;

  const isActive = selectedSuiteId === suite.id;

  return (
    <div className="select-none group/item">
      <div
        onClick={() =>
          router.push(`/projects/${projectCode}/repository?suite=${suite.id}`)
        }
        className={cn(
          "flex items-center py-1.5 pr-2 cursor-pointer transition-colors relative",
          level === 0 ? "font-semibold text-[13px]" : "font-medium text-[13px]",
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-text-main hover:bg-surface-hover",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isActive && (
          <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSuite(suite.id);
          }}
          className={cn(
            "p-0.5 rounded mr-1 transition-colors shrink-0",
            isActive
              ? "text-indigo-500"
              : "text-text-muted hover:text-text-muted",
          )}
        >
          {isOpen ? (
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 7l5 5-5 5z" />
            </svg>
          )}
        </button>

        <svg
          className={cn(
            "w-3.5 h-3.5 mr-1.5 shrink-0",
            isActive ? "text-indigo-400" : "text-text-muted",
          )}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>

        <span className="truncate">{suite.title}</span>

        <div className="ml-auto flex items-center pl-2">
          {suite.caseCount !== undefined && (
            <span
              className={[
                "text-[11px] font-semibold px-1.5 py-0.5 rounded-full group-hover/item:hidden",
                isActive
                  ? "bg-indigo-100 text-indigo-900"
                  : "bg-surface-hover text-text-main",
              ].join(" ")}
            >
              {suite.caseCount}
            </span>
          )}

          {role !== "VIEWER" && (
            <div className="hidden group-hover/item:flex items-center text-text-muted">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOpen) toggleSuite(suite.id);
                  onAddChild(suite.id);
                }}
                className="p-0.5 hover:text-indigo-600 transition-colors mx-1"
                title="Add child suite"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen && hasChildren ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden mt-0.5">
          {hasChildren &&
            suite.children!.map((child: any) => (
              <SuiteItem
                key={child.id}
                suite={child}
                level={level + 1}
                projectCode={projectCode}
                selectedSuiteId={selectedSuiteId}
                onAddChild={onAddChild}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export const SuiteTree = ({
  initialSuites,
  cases = [],
  projectCode,
}: {
  initialSuites: any[];
  cases?: any[];
  projectCode: string;
}) => {
  const [suites, setSuites] = useState<any[]>(initialSuites);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSuiteTitle, setNewSuiteTitle] = useState("");
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    setSuites(initialSuites);
  }, [initialSuites]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useProjectRole();
  const { expandAll, collapseAll } = useSuiteExpansion();
  const selectedSuiteId = searchParams.get("suite");

  // Build tree from flat array and calculate case counts
  const buildTree = (flatList: any[], allCases: any[]) => {
    const map = new Map();
    const roots: any[] = [];

    // Group cases by suite
    const casesBySuite = new Map<string, number>();
    allCases.forEach((tc) => {
      const sId = tc.suiteId || "unassigned";
      casesBySuite.set(sId, (casesBySuite.get(sId) || 0) + 1);
    });
    flatList.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });
    flatList.forEach((item) => {
      const node = map.get(item.id);
      if (item.parentId) {
        if (map.has(item.parentId)) {
          map.get(item.parentId).children.push(node);
        } else {
          roots.push(node); // Fallback if parent missing
        }
      } else {
        roots.push(node);
      }
    });

    // Recursively calculate counts
    const calculateCounts = (node: any) => {
      let count = casesBySuite.get(node.id) || 0;
      node.children.forEach((child: any) => {
        count += calculateCounts(child);
      });
      node.caseCount = count;
      return count;
    };

    roots.forEach(calculateCounts);

    return roots;
  };

  const suiteTree = React.useMemo(
    () => buildTree(suites, cases),
    [suites, cases],
  );
  const unassignedCount = React.useMemo(
    () => cases.filter((tc) => !tc.suiteId).length,
    [cases],
  );

  const handleOpenCreateModal = (parentId: string | null) => {
    setTargetParentId(parentId);
    setNewSuiteTitle("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSuite = async () => {
    if (!newSuiteTitle.trim()) {
      toast.error("Suite name is required");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectCode}/suites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSuiteTitle.trim(),
          parentId: targetParentId,
        }),
      });
      if (res.ok) {
        const newSuite = await res.json();
        setSuites([...suites, newSuite]);
        toast.success("Suite created successfully");
        setIsCreateModalOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create suite");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating suite");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-surface transition-colors border-r"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div
        className="px-4 py-3 border-b bg-surface flex justify-between items-center shrink-0 transition-colors"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center space-x-2 text-text-main">
          <svg
            className="w-4 h-4 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <h2 className="font-bold text-[13px] text-text-muted uppercase tracking-wider">
            Suites
          </h2>
          {role !== "VIEWER" && (
            <button
              onClick={() => handleOpenCreateModal(null)}
              className="text-text-muted hover:text-text-main ml-1"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-1 text-text-muted">
          <button
            onClick={() => expandAll(suites.map((s) => s.id))}
            className="hover:text-text-main p-1"
            title="Expand all"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button
            onClick={() => collapseAll(suites.map((s) => s.id))}
            className="hover:text-text-main p-1"
            title="Collapse all"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {suiteTree.map((suite) => (
          <SuiteItem
            key={suite.id}
            suite={suite}
            level={0}
            projectCode={projectCode}
            selectedSuiteId={selectedSuiteId}
            onAddChild={handleOpenCreateModal}
          />
        ))}
        {unassignedCount > 0 && (
          <SuiteItem
            key="unassigned"
            suite={{
              id: "unassigned",
              title: "Unassigned Test Cases",
              caseCount: unassignedCount,
              children: [],
            }}
            level={0}
            projectCode={projectCode}
            selectedSuiteId={selectedSuiteId}
            onAddChild={() => {}}
          />
        )}
      </div>

      {/* Create Suite Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-text-main">Create Suite</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-muted hover:text-text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-text-main mb-2">
                Suite Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSuiteTitle}
                onChange={(e) => setNewSuiteTitle(e.target.value)}
                placeholder="e.g. Authentication, Shopping Cart"
                className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateSuite();
                  }
                }}
              />
            </div>

            <div className="px-6 py-4 bg-surface-hover border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-text-muted bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSuite}
                disabled={isCreating}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Suite"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
