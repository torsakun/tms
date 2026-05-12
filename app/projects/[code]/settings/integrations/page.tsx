"use client";

import React, { useState, useEffect, use } from "react";
import { GitBranch, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ProjectIntegrationsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  const [settings, setSettings] = useState({
    githubOwner: "",
    githubRepo: "",
    githubToken: "",
    githubWorkflowId: ""
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${code}/integrations`);
        if (res.ok) {
          const data = await res.json();
          setSettings({
            githubOwner: data.integrations.githubOwner || "",
            githubRepo: data.integrations.githubRepo || "",
            githubToken: data.integrations.githubToken || "",
            githubWorkflowId: data.integrations.githubWorkflowId || ""
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [code]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${code}/integrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccess("Integrations saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-text-main flex items-center">
          <GitBranch className="mr-3 text-slate-800" />
          GitHub Integration
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Configure the target GitHub repository for this specific project. If left blank, it will fallback to the global system settings.
        </p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center">
          <AlertCircle size={18} className="mr-2" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 flex items-center">
          <CheckCircle2 size={18} className="mr-2" /> {success}
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-main">GitHub Owner</label>
            <input 
              type="text" 
              value={settings.githubOwner}
              onChange={(e) => setSettings({...settings, githubOwner: e.target.value})}
              placeholder="e.g., torsakun"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <p className="text-xs text-text-muted">The organization or user account name.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-main">GitHub Repository Name</label>
            <input 
              type="text" 
              value={settings.githubRepo}
              onChange={(e) => setSettings({...settings, githubRepo: e.target.value})}
              placeholder="e.g., ai_testing"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <p className="text-xs text-text-muted">The name of the target repository.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main">GitHub Personal Access Token</label>
          <input 
            type="password" 
            value={settings.githubToken}
            onChange={(e) => setSettings({...settings, githubToken: e.target.value})}
            placeholder="ghp_..."
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <p className="text-xs text-text-muted">A token with 'repo' scope access. Leave blank to use the global token from .env.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main">Actions Workflow Filename</label>
          <input 
            type="text" 
            value={settings.githubWorkflowId}
            onChange={(e) => setSettings({...settings, githubWorkflowId: e.target.value})}
            placeholder="e.g., playwright.yml"
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <p className="text-xs text-text-muted">Optional. Specify a custom workflow YAML file name. Defaults to playwright.yml</p>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
