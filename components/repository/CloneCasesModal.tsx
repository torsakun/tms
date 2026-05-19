import React, { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloneCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseCount: number;
  allSuites: any[];
  projectCode: string;
  onClone: (payload: {
    destinationId: string | null;
  }) => void;
  isCloning: boolean;
}

export function CloneCasesModal({
  isOpen,
  onClose,
  caseCount,
  allSuites,
  projectCode,
  onClone,
  isCloning
}: CloneCasesModalProps) {
  // Use undefined to represent "Keep original suite", null for "Project root", and string for specific suite.
  const [destinationId, setDestinationId] = useState<string | null | undefined>(undefined);
  const [isDestOpen, setIsDestOpen] = useState(false);

  if (!isOpen) return null;

  const handleClone = () => {
    onClone({ destinationId: destinationId === undefined ? undefined : destinationId } as any);
  };

  const getSuiteName = (id: string | null | undefined) => {
    if (id === undefined) return "Keep original suite";
    if (id === null) return "Project root";
    return allSuites.find(s => s.id === id)?.title || "Unknown Suite";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-slate-800">Clone cases</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <p className="text-[15px] text-slate-700 mb-6">
            Are you sure you want to clone <strong>{caseCount} test case{caseCount !== 1 ? 's' : ''}</strong>?
          </p>

          <div className="space-y-5">
            {/* Clone destination */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Clone destination</label>
              <div 
                className="flex items-center px-3 py-2 border border-slate-300 rounded cursor-pointer hover:border-blue-500 transition-colors bg-white"
                onClick={() => setIsDestOpen(!isDestOpen)}
              >
                <span className="text-sm text-slate-700">{getSuiteName(destinationId)}</span>
                <ChevronDown size={16} className="ml-auto text-slate-400" />
              </div>
              
              {isDestOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 max-h-60 overflow-y-auto py-1">
                  <div 
                    className={cn("px-4 py-2 text-sm cursor-pointer flex items-center justify-between", destinationId === undefined ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}
                    onClick={() => { setDestinationId(undefined); setIsDestOpen(false); }}
                  >
                    <span>Keep original suite</span>
                    {destinationId === undefined && <Check size={16} />}
                  </div>
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
      {isDestOpen && (
        <div className="fixed inset-0 z-[5]" onClick={() => setIsDestOpen(false)} />
      )}
    </div>
  );
}
