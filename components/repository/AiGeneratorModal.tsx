"use client";

import React, { useState, useRef } from "react";
import { X, Sparkles, AlertCircle, CheckCircle2, Check, Upload, Image as ImageIcon, FileText, Ticket, Loader2 } from "lucide-react";

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  suites: any[];
  onSuccess: () => void;
  initialTab?: "TEXT" | "IMAGE" | "JIRA";
}

export function AiGeneratorModal({ isOpen, onClose, projectCode, suites, onSuccess, initialTab = "TEXT" }: AiGeneratorModalProps) {
  const [step, setStep] = useState<"INPUT" | "LOADING" | "REVIEW">("INPUT");
  const [activeTab, setActiveTab] = useState<"TEXT" | "IMAGE" | "JIRA">(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStep("INPUT");
    }
  }, [isOpen, initialTab]);
  
  const [modelProvider, setModelProvider] = useState("openai");
  const [targetSuiteId, setTargetSuiteId] = useState("");
  
  // Tab states
  const [requirementText, setRequirementText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [jiraTicketId, setJiraTicketId] = useState("");
  const [isFetchingJira, setIsFetchingJira] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [generatedCases, setGeneratedCases] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [fetchedJiraImages, setFetchedJiraImages] = useState<string[]>([]);
  
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Text File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRequirementText(prev => prev ? prev + "\n\n" + text : text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Handle Jira Fetch
  const handleJiraFetch = async () => {
    if (!jiraTicketId.trim()) {
      setError("Please enter a Jira Ticket ID");
      return;
    }
    
    setIsFetchingJira(true);
    setError("");

    try {
      let cleanTicketId = jiraTicketId.trim();
      
      // Auto-extract ticket ID if user pastes a full Jira URL
      const urlMatch = cleanTicketId.match(/\/browse\/([A-Z0-9]+-\d+)/i);
      if (urlMatch && urlMatch[1]) {
        cleanTicketId = urlMatch[1];
        setJiraTicketId(cleanTicketId); // update UI
      }
      
      const res = await fetch(`/api/integrations/jira/issue?ticketId=${encodeURIComponent(cleanTicketId)}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch Jira ticket");
      
      setRequirementText(data.requirementText);
      if (data.imagesBase64 && Array.isArray(data.imagesBase64)) {
        setFetchedJiraImages(data.imagesBase64);
      } else {
        setFetchedJiraImages([]);
      }
      setActiveTab("TEXT"); // Switch back to text to show the fetched content
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingJira(false);
    }
  };

  const handleGenerate = async () => {
    if (activeTab === "TEXT" && !requirementText.trim()) {
      setError("Please provide a requirement or user story.");
      return;
    }
    if (activeTab === "IMAGE" && !imageBase64) {
      setError("Please upload an image first.");
      return;
    }
    if (activeTab === "JIRA" && !requirementText.trim()) {
      setError("Please fetch the Jira ticket first.");
      return;
    }
    
    setError("");
    setStep("LOADING");

    try {
      let imagesPayload: string[] = [];
      if (activeTab === "IMAGE" && imageBase64) {
        imagesPayload = [imageBase64];
      } else if (activeTab === "TEXT" && fetchedJiraImages.length > 0) {
        imagesPayload = fetchedJiraImages;
      }

      const res = await fetch(`/api/projects/${projectCode}/ai/generate-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          requirementText: activeTab === "IMAGE" ? "Analyze the provided UI mockup/image." : requirementText, 
          modelProvider,
          imagesBase64: imagesPayload.length > 0 ? imagesPayload : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      if (Array.isArray(data)) {
        setGeneratedCases(data);
        setSelectedIndices(new Set(data.map((_, i) => i)));
        setStep("REVIEW");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setError(err.message);
      setStep("INPUT");
    }
  };

  const handleSave = async () => {
    if (selectedIndices.size === 0) {
      setError("Please select at least one test case to save.");
      return;
    }

    const casesToSave = generatedCases.filter((_, i) => selectedIndices.has(i));
    setError("");
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases: casesToSave, suiteId: targetSuiteId || null })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save cases");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-[800px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background shrink-0">
          <div className="flex items-center space-x-2 text-text-main">
            <Sparkles className="text-amber-500" size={20} />
            <h3 className="text-lg font-bold">Generate Cases with AI</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 flex items-center shrink-0">
              <AlertCircle size={18} className="mr-2 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === "INPUT" && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-6 shrink-0">
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
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">Target Suite (Optional)</label>
                  <select 
                    value={targetSuiteId}
                    onChange={(e) => setTargetSuiteId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                  >
                    <option value="">No Suite (Root)</option>
                    {suites.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-surface-hover p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setActiveTab("TEXT")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-all ${activeTab === 'TEXT' ? 'bg-background shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                  <FileText size={16} className="mr-2" /> Text & Files
                </button>
                <button
                  onClick={() => setActiveTab("IMAGE")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-all ${activeTab === 'IMAGE' ? 'bg-background shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                  <ImageIcon size={16} className="mr-2" /> UI Mockup
                </button>
                <button
                  onClick={() => setActiveTab("JIRA")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-all ${activeTab === 'JIRA' ? 'bg-background shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                  <Ticket size={16} className="mr-2" /> Jira Ticket
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                {activeTab === "TEXT" && (
                  <div className="flex flex-col h-full space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-text-main">Requirement / User Story</label>
                      <div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          accept=".txt,.md,.csv,.json" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium text-primary hover:text-blue-700 flex items-center transition-colors"
                        >
                          <Upload size={14} className="mr-1" /> Import File
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={requirementText}
                      onChange={(e) => setRequirementText(e.target.value)}
                      placeholder="Paste your acceptance criteria, or import a file..."
                      className="w-full flex-1 min-h-[200px] px-4 py-3 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-sm placeholder:text-text-muted/50"
                    />
                    {fetchedJiraImages.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-text-muted mb-2">Attachments from Jira</label>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {fetchedJiraImages.map((img, idx) => (
                            <img key={idx} src={img} alt={`Attachment ${idx+1}`} className="h-16 w-16 object-cover rounded border border-border shrink-0" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "IMAGE" && (
                  <div className="flex flex-col h-full">
                    <label className="block text-sm font-semibold text-text-main mb-3">Upload UI Mockup</label>
                    <div 
                      className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-colors ${imageBase64 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface-hover'}`}
                    >
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        accept="image/png, image/jpeg, image/webp" 
                      />
                      {imageBase64 ? (
                        <div className="relative w-full h-full p-2 flex items-center justify-center">
                          <img src={imageBase64} alt="Uploaded Mockup" className="max-w-full max-h-[200px] object-contain rounded-lg shadow-sm" />
                          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-text-main shadow-sm pointer-events-none">
                            Click to change image
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-text-muted pointer-events-none">
                          <ImageIcon size={48} className="mb-4 opacity-50" />
                          <p className="font-medium text-text-main">Click or drag image here</p>
                          <p className="text-sm mt-1">Supports PNG, JPG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "JIRA" && (
                  <div className="flex flex-col h-full justify-center">
                    <div className="bg-background border border-border p-8 rounded-xl shadow-sm max-w-lg w-full mx-auto text-center">
                      <div className="w-16 h-16 bg-blue-500/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Ticket size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-text-main mb-2">Fetch from Jira</h3>
                      <p className="text-sm text-text-muted mb-6">
                        Enter your Jira Ticket ID (e.g. APP-123) and we will fetch the description and acceptance criteria automatically.
                      </p>
                      
                      <div className="flex space-x-3">
                        <input 
                          type="text" 
                          value={jiraTicketId}
                          onChange={(e) => setJiraTicketId(e.target.value)}
                          placeholder="e.g. PROJ-404"
                          className="flex-1 px-4 py-2.5 bg-surface border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm uppercase"
                          onKeyDown={(e) => { if(e.key === 'Enter') handleJiraFetch(); }}
                        />
                        <button 
                          onClick={handleJiraFetch}
                          disabled={isFetchingJira || !jiraTicketId.trim()}
                          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 flex items-center"
                        >
                          {isFetchingJira ? <Loader2 size={18} className="animate-spin" /> : 'Fetch'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-20 flex-1">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-4 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Analyzing {activeTab === "IMAGE" ? "mockup" : "requirement"}...</h3>
              <p className="text-text-muted">Extracting edge cases and generating step-by-step instructions.</p>
            </div>
          )}

          {step === "REVIEW" && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="font-bold text-text-main text-lg">Review Generated Cases</h4>
                  <p className="text-sm text-text-muted mt-1">{generatedCases.length} cases generated. Select the ones you want to keep.</p>
                </div>
                <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {selectedIndices.size} selected
                </div>
              </div>

              <div className="space-y-3">
                {generatedCases.map((tc, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-lg transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                    >
                      <div 
                        className="p-4 flex items-start cursor-pointer select-none"
                        onClick={() => toggleSelection(idx)}
                      >
                        <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-text-muted'}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">{tc.severity}</span>
                            <h4 className="font-bold text-text-main leading-tight">{tc.title}</h4>
                          </div>
                          {tc.description && <p className="text-xs text-text-muted mt-2 line-clamp-2">{tc.description}</p>}
                          
                          <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Steps ({tc.steps?.length || 0})</p>
                            {tc.steps?.slice(0, 2).map((step: any, sIdx: number) => (
                              <div key={sIdx} className="text-xs flex">
                                <span className="font-mono text-text-muted mr-2">{sIdx + 1}.</span>
                                <span className="text-text-main">{step.action}</span>
                              </div>
                            ))}
                            {tc.steps?.length > 2 && (
                              <div className="text-xs text-primary font-medium">+ {tc.steps.length - 2} more steps</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            Cancel
          </button>
          
          {step === "INPUT" && (
            <button 
              onClick={handleGenerate}
              className="flex items-center px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-bold shadow-sm transition-all"
            >
              <Sparkles size={16} className="mr-2" />
              Generate
            </button>
          )}

          {step === "REVIEW" && (
            <button 
              onClick={handleSave}
              disabled={selectedIndices.size === 0 || isSaving}
              className="flex items-center px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  Save Selected
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
