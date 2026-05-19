import React, { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloneSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: any;
  allSuites: any[];
  projectCode: string;
  onClone: (payload: {
    destinationId: string | null;
    strategy: "cases_and_suites" | "only_suites";
    prefix: string;
    withChildren: boolean;
  }) => void;
  isCloning: boolean;
}

export function CloneSuiteModal({
  isOpen,
  onClose,
  suite,
  allSuites,
  projectCode,
  onClone,
  isCloning
}: CloneSuiteModalProps) {
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"cases_and_suites" | "only_suites">("cases_and_suites");
  const [prefix, setPrefix] = useState("");
  const [withChildren, setWithChildren] = useState(false);
  
  // Custom dropdown states
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  if (!isOpen) return null;

  const handleClone = () => {
    onClone({ destinationId, strategy, prefix, withChildren });
  };

  const getSuiteName = (id: string | null) => {
    if (!id) return "Project root";
    return allSuites.find(s => s.id === id)?.title || "Unknown Suite";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-slate-800">Clone suite and cases</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <p className="text-[15px] text-slate-700 mb-6">
            Are you sure you want to clone <strong>suite "{suite.title}"</strong>?
          </p>

          <div className="space-y-5">
            {/* Target Project (Read-only for now) */}
            <div>
              <div className="flex items-center px-3 py-2 border border-slate-300 rounded bg-slate-50 cursor-not-allowed">
                <div className="w-5 h-5 rounded bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold mr-2">
                  {projectCode.substring(0,2)}
                </div>
                <span className="text-sm text-slate-700 font-medium">{projectCode} Project ({projectCode})</span>
                <ChevronDown size={16} className="ml-auto text-slate-400" />
              </div>
            </div>

            {/* Clone destination */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Clone destination</label>
              <div 
                className="flex items-center px-3 py-2 border border-slate-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => setIsDestOpen(!isDestOpen)}
              >
                <span className="text-sm text-slate-700">{getSuiteName(destinationId)}</span>
                <ChevronDown size={16} className="ml-auto text-slate-400" />
              </div>
              
              {isDestOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 max-h-60 overflow-y-auto py-1">
                  <div 
                    className={cn("px-4 py-2 text-sm cursor-pointer flex items-center justify-between", destinationId === null ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}
                    onClick={() => { setDestinationId(null); setIsDestOpen(false); }}
                  >
                    <span>Project root</span>
                    {destinationId === null && <Check size={16} />}
                  </div>
                  {allSuites.map(s => (
                    <div 
                      key={s.id}
                      className={cn("px-4 py-2 text-sm cursor-pointer flex items-center justify-between", destinationId === s.id ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}
                      onClick={() => { setDestinationId(s.id); setIsDestOpen(false); }}
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
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Clone strategy</label>
              <div 
                className="flex items-center px-3 py-2 border border-blue-500 rounded cursor-pointer shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-colors"
                onClick={() => setIsStrategyOpen(!isStrategyOpen)}
              >
                <span className="text-sm text-slate-700">
                  {strategy === "cases_and_suites" ? "Cases and suites" : "Only suites"}
                </span>
                <ChevronDown size={16} className="ml-auto text-slate-400" />
              </div>

              {isStrategyOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 py-1">
                  <div 
                    className={cn("px-4 py-2 text-sm cursor-pointer flex items-center justify-between", strategy === "cases_and_suites" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}
                    onClick={() => { setStrategy("cases_and_suites"); setIsStrategyOpen(false); }}
                  >
                    <span>Cases and suites</span>
                    {strategy === "cases_and_suites" && <Check size={16} />}
                  </div>
                  <div 
                    className={cn("px-4 py-2 text-sm cursor-pointer flex items-center justify-between", strategy === "only_suites" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}
                    onClick={() => { setStrategy("only_suites"); setIsStrategyOpen(false); }}
                  >
                    <span>Only suites</span>
                    {strategy === "only_suites" && <Check size={16} />}
                  </div>
                </div>
              )}
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Prefix</label>
              <input 
                type="text" 
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Clone with children */}
            <div className="flex items-center space-x-2 pt-2 cursor-pointer" onClick={() => setWithChildren(!withChildren)}>
              <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors">
                {withChildren ? (
                  <div className="w-full h-full bg-blue-600 border-blue-600 text-white rounded flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-full h-full border-slate-300 bg-white rounded" />
                )}
              </div>
              <span className="text-[14px] text-slate-700 select-none">Clone with children</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end space-x-3 bg-slate-50 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition-colors"
            disabled={isCloning}
          >
            Cancel
          </button>
          <button 
            onClick={handleClone}
            disabled={isCloning}
            className="px-4 py-2 bg-[#4834d4] hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center"
          >
            {isCloning ? 'Cloning...' : 'Clone'}
          </button>
        </div>
      </div>
      
      {/* Backdrop for dropdowns */}
      {(isDestOpen || isStrategyOpen) && (
        <div className="fixed inset-0 z-[5]" onClick={() => { setIsDestOpen(false); setIsStrategyOpen(false); }} />
      )}
    </div>
  );
}
