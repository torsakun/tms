import React, { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CloneSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite?: any;
  caseCount?: number;
  mode?: "suite" | "cases";
  allSuites: any[];
  projectCode: string;
  onClone: (payload: {
    destinationId: string | null;
    strategy: "cases_and_suites" | "only_suites";
    withChildren: boolean;
  }) => void;
  isCloning: boolean;
}

export function CloneSuiteModal({
  isOpen,
  onClose,
  suite,
  caseCount,
  mode = "suite",
  allSuites,
  projectCode,
  onClone,
  isCloning,
}: CloneSuiteModalProps) {
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"cases_and_suites" | "only_suites">(
    "cases_and_suites",
  );
  const [withChildren, setWithChildren] = useState(false);

  // Custom dropdown states
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  if (!isOpen) return null;

  const handleClone = () => {
    onClone({ destinationId, strategy, withChildren });
  };

  const getSuiteName = (id: string | null) => {
    if (!id) return "Project root";
    return allSuites.find((s) => s.id === id)?.title || "Unknown Suite";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40">
      <div
        className="bg-surface rounded-lg shadow-xl w-full max-w-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-text-main">
            {mode === "suite" ? "Clone suite and cases" : "Clone cases"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-muted transition-colors p-1 rounded hover:bg-surface-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <p className="text-[15px] text-text-main mb-6">
            {mode === "suite" ? (
              <>
                Are you sure you want to clone{" "}
                <strong>suite "{suite?.title}"</strong>?
              </>
            ) : (
              <>
                Are you sure you want to clone{" "}
                <strong>
                  {caseCount} test case{caseCount !== 1 ? "s" : ""}
                </strong>
                ?
              </>
            )}
          </p>

          <div className="space-y-5">
            {/* Target Project (Read-only for now) */}
            <div>
              <div className="flex items-center px-3 py-2 border border-text-muted rounded bg-surface-hover cursor-not-allowed">
                <div className="w-5 h-5 rounded bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold mr-2">
                  {projectCode.substring(0, 2)}
                </div>
                <span className="text-sm text-text-main font-medium">
                  {projectCode} Project ({projectCode})
                </span>
                <ChevronDown size={16} className="ml-auto text-text-muted" />
              </div>
            </div>

            {/* Clone destination */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-text-main mb-1.5">
                Clone destination
              </label>
              <div
                className="flex items-center px-3 py-2 border border-text-muted rounded cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => setIsDestOpen(!isDestOpen)}
              >
                <span className="text-sm text-text-main">
                  {getSuiteName(destinationId)}
                </span>
                <ChevronDown size={16} className="ml-auto text-text-muted" />
              </div>

              {isDestOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded shadow-lg z-10 max-h-60 overflow-y-auto py-1">
                  <div
                    className={cn(
                      "px-4 py-2 text-sm cursor-pointer flex items-center justify-between",
                      destinationId === null
                        ? "bg-blue-50 text-primary"
                        : "hover:bg-surface-hover text-text-main",
                    )}
                    onClick={() => {
                      setDestinationId(null);
                      setIsDestOpen(false);
                    }}
                  >
                    <span>Project root</span>
                    {destinationId === null && <Check size={16} />}
                  </div>
                  {allSuites.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "px-4 py-2 text-sm cursor-pointer flex items-center justify-between",
                        destinationId === s.id
                          ? "bg-blue-50 text-primary"
                          : "hover:bg-surface-hover text-text-main",
                      )}
                      onClick={() => {
                        setDestinationId(s.id);
                        setIsDestOpen(false);
                      }}
                    >
                      <span className="truncate pr-4">{s.title}</span>
                      {destinationId === s.id && <Check size={16} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clone strategy */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-text-main mb-1.5">
                Clone strategy
              </label>
              <div
                className="flex items-center px-3 py-2 border border-blue-500 rounded cursor-pointer shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-colors"
                onClick={() => setIsStrategyOpen(!isStrategyOpen)}
              >
                <span className="text-sm text-text-main">
                  {strategy === "cases_and_suites"
                    ? "Cases and suites"
                    : "Only suites"}
                </span>
                <ChevronDown size={16} className="ml-auto text-text-muted" />
              </div>

              {isStrategyOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded shadow-lg z-10 py-1">
                  <div
                    className={cn(
                      "px-4 py-2 text-sm cursor-pointer flex items-center justify-between",
                      strategy === "cases_and_suites"
                        ? "bg-blue-50 text-primary"
                        : "hover:bg-surface-hover text-text-main",
                    )}
                    onClick={() => {
                      setStrategy("cases_and_suites");
                      setIsStrategyOpen(false);
                    }}
                  >
                    <span>Cases and suites</span>
                    {strategy === "cases_and_suites" && <Check size={16} />}
                  </div>
                  <div
                    className={cn(
                      "px-4 py-2 text-sm cursor-pointer flex items-center justify-between",
                      strategy === "only_suites"
                        ? "bg-blue-50 text-primary"
                        : "hover:bg-surface-hover text-text-main",
                    )}
                    onClick={() => {
                      setStrategy("only_suites");
                      setIsStrategyOpen(false);
                    }}
                  >
                    <span>Only suites</span>
                    {strategy === "only_suites" && <Check size={16} />}
                  </div>
                </div>
              )}
            </div>

            {/* Clone with children */}
            <div
              className="flex items-center space-x-2 pt-2 cursor-pointer"
              onClick={() => setWithChildren(!withChildren)}
            >
              <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors">
                {withChildren ? (
                  <div className="w-full h-full bg-primary border-blue-600 text-white rounded flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-full h-full border-text-muted bg-surface rounded" />
                )}
              </div>
              <span className="text-[14px] text-text-main select-none">
                Clone with children
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end space-x-3 bg-surface-hover rounded-b-lg">
          <Button variant="secondary" onClick={onClose} disabled={isCloning}>
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            loading={isCloning}
            className="bg-[#4834d4] hover:bg-primary-hover text-white"
          >
            {isCloning ? "Cloning..." : "Clone"}
          </Button>
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(isDestOpen || isStrategyOpen) && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => {
            setIsDestOpen(false);
            setIsStrategyOpen(false);
          }}
        />
      )}
    </div>
  );
}
