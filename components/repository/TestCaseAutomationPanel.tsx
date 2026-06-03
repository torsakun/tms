"use client";

import React, { useState } from "react";
import { Sparkles, Code, CheckCircle2, Copy, Terminal, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";

interface TestCaseAutomationPanelProps {
  testCase: any;
  projectCode: string;
  onUpdate: () => void;
}

export function TestCaseAutomationPanel({ testCase, projectCode, onUpdate }: TestCaseAutomationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [domContext, setDomContext] = useState("");
  const [autoCapturedDom, setAutoCapturedDom] = useState<string | null>(null);
  const [script, setScript] = useState(testCase.automationScript || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationLog, setVerificationLog] = useState<string | null>(testCase.lastVerificationLog || null);
  const [isVerificationExpanded, setIsVerificationExpanded] = useState(!!testCase.lastVerificationLog);

  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [githubPrUrl, setGithubPrUrl] = useState<string | null>(testCase.githubPrUrl || null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setSuccess("");
    setScript("");

    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/ai/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domContext })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate script");

      setScript(data.script);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplore = async () => {
    setIsExploring(true);
    setError("");
    setSuccess("");
    setScript("");

    try {
      // Extract URL from DOM context if provided
      let startUrl = "";
      const urlMatch = domContext.match(/url\s*[:=]?\s*(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        startUrl = urlMatch[1];
      }

      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/ai/explore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrl, additionalContext: domContext })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explore and generate script");

      setScript(data.script);
      setSuccess("Agent successfully explored the app and generated the script!");
      setTimeout(() => setSuccess(""), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExploring(false);
    }
  };

  const handleAutoFix = async () => {
    if (!verificationLog) return;
    setIsFixing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/ai/fix-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, errorLog: verificationLog, domContext: autoCapturedDom || domContext })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fix script");

      if (data.script.trim() === script.trim()) {
        setSuccess("AI could not find a fix. Try pasting the page HTML into the 'DOM Snippet' field first!");
      } else {
        setScript(data.script);
        setSuccess("Script fixed by AI! You can verify it again.");
      }
      setTimeout(() => setSuccess(""), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFixing(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError("");
    setSuccess("");
    setIsVerificationExpanded(true);
    setAutoCapturedDom(null);
    setVerificationLog("Executing script in background...\nWaiting for Playwright logs...");

    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setVerificationLog(data.logs);
      if (data.failedDomContext) {
        setAutoCapturedDom(data.failedDomContext);
      }
      if (data.passed) {
        setSuccess("Script verification passed! You can now save it to the case.");
      } else {
        setError("Script verification failed. Check the console logs.");
      }
    } catch (err: any) {
      setError(err.message);
      setVerificationLog(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/script`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save script");

      setSuccess("Script saved successfully!");
      onUpdate();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePR = async () => {
    if (!confirm("This will commit the script to your connected GitHub repository and open a Pull Request. Proceed?")) return;
    
    setIsCreatingPR(true);
    setError("");
    setSuccess("");

    try {
      // Must save first to ensure DB is in sync
      await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/script`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script })
      });

      const res = await fetch(`/api/projects/${projectCode}/cases/${testCase.id}/github/pr`, {
        method: "POST"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Pull Request");

      setGithubPrUrl(data.prUrl);
      setSuccess("Pull Request created successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Terminal className="text-primary mr-2" size={18} />
          <h3 className="text-sm font-bold text-text-main">Automation Script (Playwright)</h3>
        </div>
        
        {script && (
          <div className="flex space-x-2">
            <button 
              onClick={copyToClipboard}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border text-text-muted hover:text-text-main hover:bg-surface-hover flex items-center transition-colors"
            >
              <Copy size={14} className="mr-1.5" /> Copy Code
            </button>
            {githubPrUrl && (
              <a 
                href={githubPrUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#238636]/10 text-[#3fb950] border border-[#238636]/30 hover:bg-[#238636]/20 flex items-center transition-colors"
              >
                <Code size={14} className="mr-1.5" /> View PR
              </a>
            )}
            <button 
              onClick={handleCreatePR}
              disabled={isCreatingPR}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-slate-800 text-white hover:bg-slate-700 flex items-center transition-colors disabled:opacity-50"
            >
              {isCreatingPR ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Code size={14} className="mr-1.5" />} 
              {isCreatingPR ? "Creating PR..." : "Create Pull Request"}
            </button>
            <button 
              onClick={handleVerify}
              disabled={isVerifying || process.env.NEXT_PUBLIC_IS_DEMO === 'true'}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center transition-colors disabled:opacity-50"
              title={process.env.NEXT_PUBLIC_IS_DEMO === 'true' ? "Disabled in Demo Version" : ""}
            >
              {isVerifying ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Terminal size={14} className="mr-1.5" />} 
              {isVerifying ? "Verifying..." : "Verify Script"}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />} 
              {isSaving ? "Saving..." : "Save to Case"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 flex items-center text-sm">
          <AlertCircle size={16} className="mr-2 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 flex items-center text-sm">
          <CheckCircle2 size={16} className="mr-2 shrink-0" />
          {success}
        </div>
      )}

      {/* Verification Log Console */}
      {verificationLog && (
        <div className="mb-6 border border-border rounded-lg overflow-hidden bg-[#0d1117]">
          <div 
            onClick={() => setIsVerificationExpanded(!isVerificationExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between bg-slate-900 border-b border-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center text-xs font-bold text-slate-300">
              <Terminal size={14} className="mr-2 text-text-muted" />
              Verification Console Output
            </div>
            <div className="flex items-center space-x-3">
              {autoCapturedDom && (
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 text-[10px] font-bold flex items-center">
                  <CheckCircle2 size={10} className="mr-1" /> DOM Captured
                </div>
              )}
              {(verificationLog.includes('failed') || verificationLog.includes('Error') || verificationLog.includes('timeout')) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAutoFix(); }}
                  disabled={isFixing}
                  className="px-2 py-1 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 rounded border border-amber-500/30 text-[10px] font-bold flex items-center transition-colors disabled:opacity-50"
                >
                  {isFixing ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Sparkles size={12} className="mr-1" />}
                  {isFixing ? "Fixing..." : "Auto-fix with AI"}
                </button>
              )}
              {isVerificationExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
            </div>
          </div>
          
          {isVerificationExpanded && (
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {verificationLog}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* DOM Context Section */}
      <div className="mb-6 border border-border rounded-lg overflow-hidden bg-background/50">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-surface-hover/50 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center text-sm font-medium text-text-main">
            <Code size={16} className="mr-2 text-text-muted" />
            Page Context / DOM Snippet (Optional)
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </button>
        
        {isExpanded && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-text-muted mb-2">
              Paste a snippet of HTML or Page Object Model to help the AI map exact locators instead of guessing.
            </p>
            <textarea 
              value={domContext}
              onChange={(e) => setDomContext(e.target.value)}
              placeholder="<form id='login'>\n  <input data-testid='email' />\n..."
              className="w-full h-32 px-3 py-2 bg-background border border-border rounded-md text-sm text-text-main font-mono focus:ring-1 focus:ring-primary/30 outline-none resize-none placeholder:text-text-muted/30"
            />
          </div>
        )}
      </div>

      {/* Generate Button */}
      {!script && !isGenerating && !isExploring && (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg bg-background/50">
          <Terminal size={32} className="text-text-muted/50 mb-3" />
          <p className="text-sm font-medium text-text-main mb-4">No automation script found</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleGenerate}
              className="flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold shadow-sm transition-all"
            >
              <Code size={16} className="mr-2" />
              Generate (Zero-shot)
            </button>
            <button 
              onClick={handleExplore}
              className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-bold shadow-sm transition-all"
            >
              <Sparkles size={16} className="mr-2" />
              Explore & Automate (Agentic)
            </button>
          </div>
          <p className="text-xs text-text-muted mt-4 text-center max-w-md">
            <b>Agentic Mode:</b> The AI will autonomously open a browser, navigate, and build the script. (Takes 30-60s)
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg bg-background/50">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-primary flex items-center justify-center rounded-full shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          <p className="text-sm font-bold text-text-main">Writing code...</p>
          <p className="text-xs text-text-muted mt-1">Analyzing steps and guessing locators</p>
        </div>
      )}

      {isExploring && (
        <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg bg-background/50">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            <div className="absolute inset-2 bg-primary flex items-center justify-center rounded-full shadow-md">
              <Sparkles size={16} className="text-white animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-bold text-text-main">AI is exploring the app...</p>
          <p className="text-xs text-text-muted mt-1 text-center max-w-xs">
            Opening headless browser, analyzing DOM, clicking elements, and writing code. Please wait up to 60 seconds.
          </p>
        </div>
      )}

      {/* Code Editor Preview */}
      {script && !isGenerating && !isExploring && (
        <div className="relative group mt-4">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            disabled={isFixing}
            className="w-full min-h-[400px] p-4 bg-[#0d1117] border border-slate-800 rounded-lg text-[13px] font-mono leading-relaxed text-[#c9d1d9] resize-y focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
            style={{ tabSize: 2 }}
          />
          
          {isFixing && (
            <div className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg z-10 border border-slate-800">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-amber-500 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Sparkles size={16} className="text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-white">AI is fixing the script...</p>
              <p className="text-xs text-text-muted mt-1">Analyzing Playwright logs and correcting errors</p>
            </div>
          )}
          
          <div className="absolute bottom-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleGenerate}
              className="px-3 py-1.5 bg-surface border border-border rounded-md text-xs font-semibold text-text-main hover:bg-surface-hover flex items-center shadow-sm disabled:opacity-50"
              disabled={isGenerating || isExploring}
            >
              {isGenerating ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Code size={12} className="mr-1.5" />} Zero-shot
            </button>
            <button 
              onClick={handleExplore}
              className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-xs font-semibold text-primary hover:bg-primary/20 flex items-center shadow-sm disabled:opacity-50"
              disabled={isGenerating || isExploring}
            >
              {isExploring ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Sparkles size={12} className="mr-1.5" />} Re-explore (Agentic)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
