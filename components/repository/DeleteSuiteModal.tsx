import React, { useState, useMemo } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: any;
  casesBySuiteId: Map<string, any[]>;
  childrenMap: Map<string, any[]>;
  onDelete: (retainCases: boolean) => void;
  isDeleting: boolean;
}

export function DeleteSuiteModal({
  isOpen,
  onClose,
  suite,
  casesBySuiteId,
  childrenMap,
  onDelete,
  isDeleting,
}: DeleteSuiteModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    "retain" | "deleteAll" | null
  >(null);

  // Calculate total test cases in this suite and all its descendants
  const totalCasesCount = useMemo(() => {
    if (!isOpen) return 0;

    const countCases = (suiteId: string): number => {
      let count = (casesBySuiteId.get(suiteId) || []).length;
      const children = childrenMap.get(suiteId) || [];
      for (const child of children) {
        count += countCases(child.id);
      }
      return count;
    };

    return countCases(suite.id);
  }, [isOpen, suite.id, casesBySuiteId, childrenMap]);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (!selectedOption) return;
    onDelete(selectedOption === "retain");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40">
      <div
        className="bg-surface rounded-lg shadow-xl w-full max-w-[500px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start px-6 py-5 pb-2 relative">
          <div className="flex items-center space-x-3 mt-1">
            <AlertTriangle
              className="text-red-600"
              size={24}
              strokeWidth={2.5}
            />
            <h2 className="text-xl font-bold text-text-main">Delete suite?</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-muted transition-colors p-1 rounded hover:bg-surface-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 flex-1">
          <p className="text-[15px] text-text-main mb-6">
            This suite contains{" "}
            <strong>
              {totalCasesCount} test case{totalCasesCount !== 1 ? "s" : ""}
            </strong>
            . Choose the option to delete the suite.
          </p>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="radio"
                  name="deleteOption"
                  className="peer sr-only"
                  checked={selectedOption === "retain"}
                  onChange={() => setSelectedOption("retain")}
                />
                <div className="w-4 h-4 border border-text-muted rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                <div className="absolute w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-sm text-text-main">
                Remove the suite but retain the test cases
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="radio"
                  name="deleteOption"
                  className="peer sr-only"
                  checked={selectedOption === "deleteAll"}
                  onChange={() => setSelectedOption("deleteAll")}
                />
                <div className="w-4 h-4 border border-text-muted rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                <div className="absolute w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-sm text-text-main">
                Delete the suite and all its test cases
              </span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-hover hover:bg-slate-200 text-text-main text-sm font-medium rounded transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedOption || isDeleting}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors flex items-center",
              !selectedOption
                ? "bg-surface-hover text-text-muted cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white",
            )}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
