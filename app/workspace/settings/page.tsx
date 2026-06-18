"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function WorkspaceSettingsPage() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [jiraProjectKey, setJiraProjectKey] = useState("");

  useEffect(() => {
    fetch("/api/workspace/settings")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        if (data.OPENAI_API_KEY) setOpenaiKey(data.OPENAI_API_KEY);
        if (data.GEMINI_API_KEY) setGeminiKey(data.GEMINI_API_KEY);
        if (data.CLAUDE_API_KEY) setClaudeKey(data.CLAUDE_API_KEY);
        if (data.JIRA_DOMAIN) setJiraDomain(data.JIRA_DOMAIN);
        if (data.JIRA_EMAIL) setJiraEmail(data.JIRA_EMAIL);
        if (data.JIRA_API_TOKEN) setJiraToken(data.JIRA_API_TOKEN);
        if (data.JIRA_PROJECT_KEY) setJiraProjectKey(data.JIRA_PROJECT_KEY);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/workspace/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          OPENAI_API_KEY: openaiKey,
          GEMINI_API_KEY: geminiKey,
          CLAUDE_API_KEY: claudeKey,
          JIRA_DOMAIN: jiraDomain,
          JIRA_EMAIL: jiraEmail,
          JIRA_API_TOKEN: jiraToken,
          JIRA_PROJECT_KEY: jiraProjectKey,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSuccessMessage("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-text-muted">Loading settings...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden transition-colors">
      <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center space-x-3">
          <Settings className="text-text-muted" size={24} />
          <h1 className="text-2xl font-bold text-text-main">
            Workspace Settings
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2 rounded-md text-sm font-bold flex items-center transition-all shadow-sm disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={16} className="mr-2" /> Save Changes
            </>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-100">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center border border-emerald-500/20">
              <CheckCircle2 size={18} className="mr-2" />
              {successMessage}
            </div>
          )}

          <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center">
              <Sparkles className="text-amber-500 mr-2" size={18} />
              <h2 className="text-lg font-bold text-text-main">
                AI Integrations
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-text-muted">
                Configure your API keys to enable AI-powered features like the
                Test Case Generator. Keys are stored securely in the database.
              </p>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
                <p className="text-xs text-text-muted mt-1">
                  Used for GPT-4o models.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
                <p className="text-xs text-text-muted mt-1">
                  Used for Gemini 1.5 Pro models.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Anthropic Claude API Key
                </label>
                <input
                  type="password"
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
                <p className="text-xs text-text-muted mt-1">
                  Used for Claude 3.5 Sonnet models.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center">
              <svg
                className="w-5 h-5 text-primary mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v4.35c0 2.4 1.97 4.35 4.35 4.35v-8.7C22 3.96 20.04 2 17.65 2h-6.12zm-4.7 4.7c0 2.4 1.96 4.35 4.35 4.35h1.78v4.35c0 2.4 1.96 4.35 4.34 4.35v-8.7c0-2.4-1.95-4.35-4.34-4.35H6.83zm-4.7 4.7c0 2.4 1.96 4.35 4.34 4.35h1.78v4.35C8.25 20.1 6.3 22 3.91 22v-8.7C3.91 10.9 1.95 8.95 0 8.95v2.45h2.13z" />
              </svg>
              <h2 className="text-lg font-bold text-text-main">
                Jira Integration
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-text-muted">
                Connect your Jira workspace to allow the AI to automatically
                fetch user stories and acceptance criteria from Jira Tickets.
              </p>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Jira Domain
                </label>
                <input
                  type="text"
                  value={jiraDomain}
                  onChange={(e) => setJiraDomain(e.target.value)}
                  placeholder="e.g. company.atlassian.net"
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Jira Email
                </label>
                <input
                  type="email"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Jira API Token
                </label>
                <input
                  type="password"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                  placeholder="ATATT3xFf..."
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
                <p className="text-xs text-text-muted mt-1">
                  Generate an API token from your Atlassian account settings.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1">
                  Jira Project Key
                </label>
                <input
                  type="text"
                  value={jiraProjectKey}
                  onChange={(e) => setJiraProjectKey(e.target.value)}
                  placeholder="e.g. QA"
                  className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-text-muted/50"
                />
                <p className="text-xs text-text-muted mt-1">
                  Default project where AI-drafted bug reports will be created
                  (from failed test runs).
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center">
              <svg
                className="w-5 h-5 text-emerald-500 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <h2 className="text-lg font-bold text-text-main">
                Data Backup & Export
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-background">
                <div>
                  <h3 className="text-sm font-bold text-text-main">
                    Manual JSON Export
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    Download a complete JSON snapshot of your workspace,
                    including all projects, test cases, suites, and test runs.
                    This export excludes sensitive data like passwords.
                  </p>
                </div>
                <a
                  href="/api/workspace/export"
                  download
                  className="shrink-0 bg-surface hover:bg-surface-hover border border-border text-text-main px-4 py-2 rounded-md text-sm font-semibold flex items-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export Backup
                </a>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                <div>
                  <h3 className="text-sm font-bold text-blue-900">
                    Automated SQL Backups
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Automated full database dumps are running nightly via GitHub
                    Actions. Backups are securely stored as GitHub Artifacts and
                    retained for 30 days.
                  </p>
                </div>
                <div className="shrink-0 flex items-center text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Active
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
