"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Database,
  Folder,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface BulkJiraImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  suites: any[];
  allCases: any[];
  onSuccess: () => void;
}

export function BulkJiraImpactModal({
  isOpen,
  onClose,
  projectCode,
  suites,
  allCases,
  onSuccess,
}: BulkJiraImpactModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<"INPUT" | "LOADING" | "REVIEW">("INPUT");
  const [jiraTicketId, setJiraTicketId] = useState("");
  const [newRequirementText, setNewRequirementText] = useState("");
  const [isFetchingJira, setIsFetchingJira] = useState(false);
  const [modelProvider, setModelProvider] = useState("openai");
  const [targetMode, setTargetMode] = useState<"SUITE" | "JIRA_LINKED">(
    "SUITE",
  );
  const [targetSuiteId, setTargetSuiteId] = useState("");

  const [error, setError] = useState("");
  const [impactResults, setImpactResults] = useState<any[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleJiraFetch = async () => {
    if (!jiraTicketId.trim()) {
      setError("Please enter a Jira Ticket ID");
      return;
    }

    setIsFetchingJira(true);
    setError("");

    try {
      let cleanTicketId = jiraTicketId.trim();
      const urlMatch = cleanTicketId.match(/\/browse\/([A-Z0-9]+-\d+)/i);
      if (urlMatch && urlMatch[1]) {
        cleanTicketId = urlMatch[1];
        setJiraTicketId(cleanTicketId);
      }

      const res = await fetch(
        `/api/integrations/jira/issue?ticketId=${encodeURIComponent(cleanTicketId)}`,
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch Jira ticket");

      setNewRequirementText(data.requirementText);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingJira(false);
    }
  };

  const handleAnalyze = async () => {
    if (!newRequirementText.trim()) {
      setError("Please fetch the requirement from Jira first.");
      return;
    }

    // Determine target cases
    let targetCaseIds: string[] = [];
    if (targetMode === "SUITE") {
      if (!targetSuiteId) {
        setError("Please select a target suite.");
        return;
      }
      targetCaseIds = allCases
        .filter((c) => c.suiteId === targetSuiteId)
        .map((c) => c.id);
    } else {
      // Find cases linked to this Jira ticket
      targetCaseIds = allCases
        .filter((c) => c.jiraId === jiraTicketId)
        .map((c) => c.id);
    }

    if (targetCaseIds.length === 0) {
      setError(
        `No test cases found for the selected target (${targetMode === "SUITE" ? "Suite" : "Jira ID"}).`,
      );
      return;
    }

    setError("");
    setStep("LOADING");

    try {
      const res = await fetch(`/api/projects/${projectCode}/ai/impact/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRequirementText,
          modelProvider,
          caseIds: targetCaseIds,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to analyze impact in bulk");

      setImpactResults(data);

      // Auto-select cases that need an update
      const initialSelection = new Set<string>();
      data.forEach((res: any) => {
        if (res.success && res.result.needsUpdate) {
          initialSelection.add(res.caseId);
        }
      });
      setSelectedCaseIds(initialSelection);

      setStep("REVIEW");
    } catch (err: any) {
      setError(err.message);
      setStep("INPUT");
    }
  };

  const handleAccept = async () => {
    if (selectedCaseIds.size === 0) return;

    setIsSaving(true);
    try {
      const updates = [];
      for (const res of impactResults) {
        if (
          selectedCaseIds.has(res.caseId) &&
          res.success &&
          res.result.needsUpdate
        ) {
          const originalCase = allCases.find((c) => c.id === res.caseId);
          updates.push({
            id: res.caseId,
            title: res.result.suggestedUpdates?.title || originalCase.title,
            description:
              res.result.suggestedUpdates?.description ||
              originalCase.description,
            preconditions:
              res.result.suggestedUpdates?.preconditions ||
              originalCase.preconditions,
            steps:
              res.result.suggestedUpdates?.steps?.map(
                (s: any, idx: number) => ({
                  action: s.action,
                  expectedResult: s.expectedResult,
                  position: idx,
                }),
              ) || originalCase.steps,
            requirementText: newRequirementText,
          });
        }
      }

      const res = await fetch(
        `/api/projects/${projectCode}/cases/bulk-update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates,
            requirementText: newRequirementText,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to update test cases");

      onSuccess();
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (caseId: string) => {
    const newSet = new Set(selectedCaseIds);
    if (newSet.has(caseId)) newSet.delete(caseId);
    else newSet.add(caseId);
    setSelectedCaseIds(newSet);
  };

  const casesNeedingUpdate = impactResults.filter(
    (r) => r.success && r.result?.needsUpdate,
  );
  const casesUnchanged = impactResults.filter(
    (r) => r.success && !r.result?.needsUpdate,
  );
  const casesFailed = impactResults.filter((r) => !r.success);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-[1000px] max-h-[95vh] rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-primary-light shrink-0">
          <div className="flex items-center space-x-2 text-primary">
            <Sparkles size={20} />
            <h3 className="text-lg font-bold">Story-Level Impact Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {error && (
            <div className="mb-6 p-4 bg-danger-soft text-danger-foreground rounded-lg border border-danger/25 flex items-center shrink-0">
              <AlertTriangle size={18} className="mr-2 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === "INPUT" && (
            <div className="space-y-6 flex-1 flex flex-col max-w-3xl mx-auto w-full">
              <div className="bg-surface p-6 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-text-main mb-4 flex items-center">
                  <Ticket size={16} className="mr-2 text-primary" />
                  1. Fetch Jira Requirement
                </h4>
                <div className="flex space-x-3 mb-4">
                  <input
                    type="text"
                    value={jiraTicketId}
                    onChange={(e) => setJiraTicketId(e.target.value)}
                    placeholder="Enter Jira Ticket ID (e.g. APP-123)"
                    className="flex-1 px-4 py-2 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJiraFetch();
                    }}
                  />
                  <Button
                    onClick={handleJiraFetch}
                    disabled={!jiraTicketId.trim()}
                    loading={isFetchingJira}
                  >
                    {!isFetchingJira && "Fetch Story"}
                  </Button>
                </div>
                {newRequirementText !== null && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Requirement Text (Editable)
                    </label>
                    <textarea
                      value={newRequirementText}
                      onChange={(e) => setNewRequirementText(e.target.value)}
                      placeholder="Paste your requirement or user story here to test without Jira..."
                      className="w-full p-4 bg-surface-hover border border-border rounded-lg h-32 text-xs text-text-main font-sans focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                    />
                  </div>
                )}
              </div>

              <div className="bg-surface p-6 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-text-main mb-4 flex items-center">
                  <Database size={16} className="mr-2 text-primary" />
                  2. Select Target Test Cases
                </h4>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === "SUITE"}
                      onChange={() => setTargetMode("SUITE")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-text-main">
                      By Test Suite
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === "JIRA_LINKED"}
                      onChange={() => setTargetMode("JIRA_LINKED")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-text-main">
                      By Linked Jira ID ({jiraTicketId || "Ticket"})
                    </span>
                  </label>
                </div>

                {targetMode === "SUITE" && (
                  <select
                    value={targetSuiteId}
                    onChange={(e) => setTargetSuiteId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">-- Select a Suite --</option>
                    {suites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (
                        {allCases.filter((c) => c.suiteId === s.id).length}{" "}
                        cases)
                      </option>
                    ))}
                  </select>
                )}
                {targetMode === "JIRA_LINKED" && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                    Will analyze all test cases in this project that have their
                    `jiraId` set to{" "}
                    <strong>{jiraTicketId || "the provided ticket"}</strong>. (
                    {allCases.filter((c) => c.jiraId === jiraTicketId).length}{" "}
                    cases found)
                  </div>
                )}
              </div>

              <div className="bg-surface p-6 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-text-main mb-4 flex items-center">
                  <Sparkles size={16} className="mr-2 text-warning" />
                  3. AI Settings
                </h4>
                <select
                  value={modelProvider}
                  onChange={(e) => setModelProvider(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="openai">
                    OpenAI (GPT-4o) - Recommended for logic
                  </option>
                  <option value="gemini">
                    Google (Gemini 1.5 Pro) - High Context
                  </option>
                  <option value="claude">
                    Anthropic (Claude 3.5 Sonnet) - Best at nuance
                  </option>
                </select>
              </div>
            </div>
          )}

          {step === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-32 flex-1">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-primary-light/20 rounded-full animate-ping"></div>
                <div
                  className="absolute inset-2 bg-primary-light/40 rounded-full animate-ping"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div className="absolute inset-4 bg-primary-light rounded-full flex items-center justify-center shadow-[0_0_30px_color-mix(in_oklch,var(--primary)_45%,transparent)]">
                  <Sparkles className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-2">
                Analyzing Test Cases in Bulk...
              </h3>
              <p className="text-text-muted">
                Comparing the new requirement against each test case.
              </p>
            </div>
          )}

          {step === "REVIEW" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-border">
                <div>
                  <h4 className="font-bold text-text-main">
                    Impact Analysis Results
                  </h4>
                  <p className="text-sm text-text-muted">
                    Analyzed {impactResults.length} cases. Found{" "}
                    {casesNeedingUpdate.length} cases that need updates.
                  </p>
                </div>
                <div className="flex space-x-4 text-sm font-medium">
                  <span className="text-warning-foreground bg-warning-soft px-3 py-1 rounded-full">
                    {casesNeedingUpdate.length} Updates
                  </span>
                  <span className="text-success-foreground bg-success-soft px-3 py-1 rounded-full">
                    {casesUnchanged.length} Unchanged
                  </span>
                  {casesFailed.length > 0 && (
                    <span className="text-danger-foreground bg-danger-soft px-3 py-1 rounded-full">
                      {casesFailed.length} Errors
                    </span>
                  )}
                </div>
              </div>

              {casesNeedingUpdate.length > 0 && (
                <div className="space-y-4">
                  <h5 className="font-bold text-text-main text-lg">
                    Test Cases to Update
                  </h5>
                  {casesNeedingUpdate.map((res, idx) => {
                    const isSelected = selectedCaseIds.has(res.caseId);
                    const originalCase = allCases.find(
                      (c) => c.id === res.caseId,
                    );

                    return (
                      <div
                        key={res.caseId}
                        className={`border rounded-xl transition-all overflow-hidden ${isSelected ? "border-primary/45 shadow-sm" : "border-border bg-surface-hover opacity-80"}`}
                      >
                        <div
                          className={`p-4 flex items-start cursor-pointer select-none ${isSelected ? "bg-primary-light/30" : ""}`}
                          onClick={() => toggleSelection(res.caseId)}
                        >
                          <div
                            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? "bg-primary border-primary text-white" : "border-text-muted bg-surface"}`}
                          >
                            {isSelected && <CheckCircle2 size={14} />}
                          </div>
                          <div className="flex-1">
                            <h4
                              className={`font-bold leading-tight ${isSelected ? "text-primary" : "text-text-main"}`}
                            >
                              {originalCase?.code}: {originalCase?.title}
                            </h4>
                            <p className="text-xs text-primary mt-1 italic">
                              "{res.result.analysis}"
                            </p>

                            {isSelected && (
                              <div className="mt-4 space-y-4 bg-surface p-4 rounded-lg border border-primary/20">
                                {res.result.suggestedUpdates?.title &&
                                  res.result.suggestedUpdates.title !==
                                    originalCase?.title && (
                                    <div>
                                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                                        Title Update
                                      </span>
                                      <div className="text-sm line-through text-danger/70 mb-1">
                                        {originalCase?.title}
                                      </div>
                                      <div className="text-sm text-success-foreground">
                                        {res.result.suggestedUpdates.title}
                                      </div>
                                    </div>
                                  )}
                                {res.result.suggestedUpdates?.steps && (
                                  <div>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                                      New Steps
                                    </span>
                                    <div className="bg-surface-hover border border-border rounded-lg overflow-hidden">
                                      {res.result.suggestedUpdates.steps.map(
                                        (step: any, sIdx: number) => (
                                          <div
                                            key={sIdx}
                                            className="flex p-2 border-b border-border last:border-0"
                                          >
                                            <div className="w-6 text-text-muted font-mono text-xs mt-0.5">
                                              {sIdx + 1}.
                                            </div>
                                            <div className="flex-1 text-sm text-text-main">
                                              <div>{step.action}</div>
                                              {step.expectedResult && (
                                                <div className="mt-0.5 text-text-muted text-xs">
                                                  Expected:{" "}
                                                  {step.expectedResult}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {casesUnchanged.length > 0 && (
                <div className="mt-8">
                  <h5 className="font-bold text-text-main text-sm mb-3">
                    No Updates Needed ({casesUnchanged.length} cases)
                  </h5>
                  <div className="bg-surface-hover rounded-lg p-4 border border-border">
                    <ul className="list-disc pl-5 space-y-1">
                      {casesUnchanged.map((res) => (
                        <li
                          key={res.caseId}
                          className="text-sm text-text-muted"
                        >
                          <strong>{res.originalTitle}</strong> -{" "}
                          <span className="text-xs italic text-text-muted">
                            {res.result?.analysis}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {casesFailed.length > 0 && (
                <div className="mt-8">
                  <h5 className="font-bold text-red-600 text-sm mb-3">
                    Failed Analysis ({casesFailed.length} cases)
                  </h5>
                  <div className="bg-danger-soft rounded-lg p-4 border border-danger/25">
                    <ul className="list-disc pl-5 space-y-1">
                      {casesFailed.map((res) => (
                        <li key={res.caseId} className="text-sm text-red-700">
                          <strong>{res.originalTitle}</strong> -{" "}
                          <span className="text-xs">{res.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface shrink-0 flex justify-end space-x-3">
          {step === "REVIEW" && (
            <Button variant="ghost" onClick={() => setStep("INPUT")}>
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          {step === "INPUT" && (
            <Button
              onClick={handleAnalyze}
              className="bg-primary hover:bg-primary-hover shadow-[var(--shadow-float)]"
            >
              <Sparkles size={16} />
              Analyze Batch
            </Button>
          )}

          {step === "REVIEW" && casesNeedingUpdate.length > 0 && (
            <Button
              variant="success"
              onClick={handleAccept}
              disabled={selectedCaseIds.size === 0}
              loading={isSaving}
              className="shadow-[0_0_10px_rgba(16,185,129,0.4)] disabled:shadow-none"
            >
              {isSaving ? (
                `Updating ${selectedCaseIds.size} cases...`
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Accept {selectedCaseIds.size} Updates
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
