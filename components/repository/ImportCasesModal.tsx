import React, { useState } from "react";
import { X, Upload, Loader2, HelpCircle } from "lucide-react";

interface ImportCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  suites: any[];
  onSuccess: () => void;
}

export function ImportCasesModal({ isOpen, onClose, projectCode, suites, onSuccess }: ImportCasesModalProps) {
  const [sourceType, setSourceType] = useState("Qase.io");
  const [parentId, setParentId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [replaceMatching, setReplaceMatching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    
    setIsImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const res = await fetch(`/api/projects/${projectCode}/import-qase`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          parentId,
          replaceMatching
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to import. Please check file format.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100]">
      <div className="bg-surface rounded-xl shadow-xl w-[500px] max-w-[90vw] overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main">Import test cases</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-muted p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm p-4 rounded-lg">
            If you're using MS Excel for managing your test cases, select the Qase.io as a source type.
          </div>
          
          <a href="#" className="flex items-center text-sm text-primary hover:underline">
            <HelpCircle size={14} className="mr-1.5" />
            How to prepare your file for the Qase JSON format
          </a>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Source type</label>
            <select 
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-text-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="Qase.io">Qase.io (JSON)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Supported formats: JSON</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Parent suite</label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3 py-2 bg-surface border border-text-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Project root</option>
              {suites.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">Select a suite into which you want to import the test cases.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Upload file <span className="text-red-500">*</span></label>
            <div className="flex items-center">
              <label className="bg-surface-hover hover:bg-slate-200 border border-text-muted text-text-main px-3 py-1.5 rounded text-sm cursor-pointer transition-colors">
                Choose a file
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }} 
                />
              </label>
              {file && <span className="ml-3 text-sm text-text-muted truncate max-w-[200px]">{file.name}</span>}
            </div>
          </div>

          <label className="flex items-center space-x-2 mt-2">
            <input 
              type="checkbox" 
              checked={replaceMatching} 
              onChange={(e) => setReplaceMatching(e.target.checked)}
              className="w-4 h-4 text-primary border-text-muted rounded focus:ring-blue-500" 
            />
            <span className="text-sm text-text-main">Replace matching test cases</span>
          </label>
        </div>

        <footer className="px-6 py-4 border-t border-border flex items-center justify-end space-x-3 bg-surface-hover shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-surface border border-text-muted text-text-main text-sm font-medium rounded-md shadow-sm hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={isImporting || !file}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            Import test cases
          </button>
        </footer>
      </div>
    </div>
  );
}
