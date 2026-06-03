"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface AiImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  testCase: any;
  onSuccess: () => void;
}

export function AiImpactModal({ isOpen, onClose, projectCode, testCase, onSuccess }: AiImpactModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"INPUT" | "LOADING" | "REVIEW">("INPUT");
  const [newRequirementText, setNewRequirementText] = useState("");
  const [modelProvider, setModelProvider] = useState("openai");
  const [error, setError] = useState("");
  const [impactResult, setImpactResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!newRequirementText.trim()) {
      setError("Please provide the new requirement text from Jira.");
      return;
    }
    setError("");
    setStep("LOADING");

    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/ai/impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newRequirementText, 
          modelProvider 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze impact");

      setImpactResult(data);
      setStep("REVIEW");
    } catch (err: any) {
      setError(err.message);
      setStep("INPUT");
    }
  };

  const handleAccept = async () => {
    setIsSaving(true);
    try {
      // Create new steps structure
      const newSteps = impactResult.suggestedUpdates.steps?.map((s: any, idx: number) => ({
        action: s.action,
        expectedResult: s.expectedResult,
        position: idx
      })) || testCase.steps;

      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: impactResult.suggestedUpdates.title || testCase.title,
          description: impactResult.suggestedUpdates.description || testCase.description,
          preconditions: impactResult.suggestedUpdates.preconditions || testCase.preconditions,
          steps: newSteps,
          requirementText: newRequirementText,
          isOutdated: false
        })
      });

      if (!res.ok) throw new Error("Failed to update test case");

      onSuccess();
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-[800px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-amber-50 shrink-0">
          <div className="flex items-center space-x-2 text-amber-800">
            <AlertTriangle size={20} />
            <h3 className="text-lg font-bold">Smart Impact Analysis</h3>
          </div>
          <button onClick={onClose} className="text-amber-600 hover:text-amber-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 flex items-center shrink-0">
              <AlertTriangle size={18} className="mr-2 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === "INPUT" && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                <strong>Test Case:</strong> {testCase.title} <br/>
                The requirement for this test case has changed in Jira. Paste the new requirement below to analyze the impact.
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">AI Model</label>
                <select 
                  value={modelProvider}
                  onChange={(e) => setModelProvider(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                >
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google (Gemini 1.5 Pro)</option>
                  <option value="claude">Anthropic (Claude 3.5 Sonnet)</option>
                </select>
              </div>

              <div className="flex-1 flex flex-col min-h-[250px]">
                <label className="block text-sm font-semibold text-text-main mb-2">New Requirement from Jira</label>
                <textarea 
                  value={newRequirementText}
                  onChange={(e) => setNewRequirementText(e.target.value)}
                  placeholder="Paste the new requirement text here..."
                  className="w-full flex-1 min-h-[200px] px-4 py-3 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-sm placeholder:text-text-muted/50"
                />
              </div>
            </div>
          )}

          {step === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-20 flex-1">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-amber-500/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-4 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                  <Sparkles className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Analyzing Requirement Diff...</h3>
              <p className="text-text-muted">Determining which test steps need updates.</p>
            </div>
          )}

          {step === "REVIEW" && impactResult && (
            <div className="space-y-6">
              <div className="bg-surface-hover p-4 rounded-lg border border-border">
                <h4 className="font-bold text-text-main mb-2">AI Analysis</h4>
                <p className="text-sm text-text-muted">{impactResult.analysis}</p>
                <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface border border-border shadow-sm">
                  Status: <span className={`ml-1 ${impactResult.needsUpdate ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}`}>{impactResult.needsUpdate ? 'Needs Update' : 'No Update Required'}</span>
                </div>
              </div>

              {impactResult.needsUpdate && impactResult.suggestedUpdates && (
                <div className="space-y-4">
                  <h4 className="font-bold text-text-main">Suggested Updates</h4>
                  
                  {impactResult.suggestedUpdates.title && impactResult.suggestedUpdates.title !== testCase.title && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                        <div className="text-[10px] font-bold text-red-500 mb-1 uppercase">Old Title</div>
                        <div className="text-sm line-through text-red-900">{testCase.title}</div>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md">
                        <div className="text-[10px] font-bold text-emerald-600 mb-1 uppercase">New Title</div>
                        <div className="text-sm text-emerald-900">{impactResult.suggestedUpdates.title}</div>
                      </div>
                    </div>
                  )}

                  {impactResult.suggestedUpdates.steps && (
                    <div>
                      <div className="text-sm font-semibold text-text-main mb-2">New Steps</div>
                      <div className="bg-background border border-border rounded-lg overflow-hidden">
                        {impactResult.suggestedUpdates.steps.map((step: any, idx: number) => (
                          <div key={idx} className="flex p-3 border-b border-border last:border-0 bg-emerald-50/30">
                            <div className="w-6 text-emerald-600 font-mono text-sm">{idx + 1}.</div>
                            <div className="flex-1 text-sm text-text-main">
                              <div>{step.action}</div>
                              {step.expectedResult && (
                                <div className="mt-1 text-text-muted text-xs"><span className="font-semibold text-emerald-700">Expected:</span> {step.expectedResult}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface shrink-0 flex justify-end space-x-3">
          {step === "REVIEW" && (
            <button 
              onClick={() => setStep("INPUT")} 
              className="px-4 py-2 rounded-md font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
            >
              Back
            </button>
          )}
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            {step === "REVIEW" && !impactResult?.needsUpdate ? "Close" : "Cancel"}
          </button>
          
          {step === "INPUT" && (
            <button 
              onClick={handleAnalyze}
              className="flex items-center px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all"
            >
              <Sparkles size={16} className="mr-2" />
              Analyze Impact
            </button>
          )}

          {step === "REVIEW" && impactResult?.needsUpdate && (
            <button 
              onClick={handleAccept}
              disabled={isSaving}
              className="flex items-center px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  Accept & Update
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
