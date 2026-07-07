"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  Bot,
  Ticket,
  Archive,
  Download,
  AlertTriangle,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Logo
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Settings states
  const [workspaceName, setWorkspaceName] = useState("QMaster Workspace");
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
        if (data.WORKSPACE_NAME) setWorkspaceName(data.WORKSPACE_NAME);
        if (data.WORKSPACE_LOGO_URL) setLogoUrl(data.WORKSPACE_LOGO_URL);
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
    try {
      const res = await fetch("/api/workspace/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          WORKSPACE_NAME: workspaceName,
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
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  
  const handleExport = () => {
    window.location.href = "/api/workspace/export";
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change.
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", "__workspace__");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const uploaded = await uploadRes.json();
      const url: string = uploaded.url;
      if (!url) throw new Error("Upload did not return a URL");

      const saveRes = await fetch("/api/workspace/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ WORKSPACE_LOGO_URL: url }),
      });
      if (!saveRes.ok) throw new Error("Failed to save logo");

      setLogoUrl(url);
      setConfig((prev: any) => ({ ...prev, WORKSPACE_LOGO_URL: url }));
      // Let other client components (e.g. TopNav) pick up the new logo.
      window.dispatchEvent(new CustomEvent("workspace-logo-updated", { detail: url }));
      toast.success("Logo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const workspaceNameForConfirm = (workspaceName || "QMaster Workspace").trim();

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText.trim() !== workspaceNameForConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirmText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete workspace");
      toast.success(
        `Workspace cleared — deleted ${data.deletedProjects ?? 0} project(s).`,
      );
      setConfirmDelete(false);
      router.push("/projects");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[980px] mx-auto p-[24px_22px] flex justify-center min-h-[400px] items-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[980px] mx-auto p-[24px_22px] antialiased font-sans pb-20">
      <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main mb-[18px]">Workspace settings</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] items-start">
        
        {/* identity */}
        <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm">
          <div className="text-[14px] font-semibold text-text-main mb-[14px]">Identity</div>
          <div className="flex items-center gap-[14px] mb-[16px]">
            <div className="w-[48px] h-[48px] rounded-[12px] bg-primary text-white flex items-center justify-center text-[20px] font-bold overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Workspace logo" className="w-full h-full object-cover" />
              ) : (
                "Q"
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploadingLogo ? "Uploading…" : "Change logo"}
            </Button>
          </div>
          <label className="block text-[12px] text-text-muted mb-[6px]">Workspace name</label>
          <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] mb-[14px]">
            <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="QMaster Workspace" className="w-full bg-transparent outline-none text-text-main font-medium" />
          </div>
          <label className="block text-[12px] text-text-muted mb-[6px]">Workspace URL</label>
          <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] text-text-muted font-mono cursor-not-allowed opacity-80">
            qmaster.io/workspace
          </div>
        </div>

        {/* AI integrations */}
        <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm">
          <div className="text-[14px] font-semibold text-text-main mb-[14px] flex items-center gap-2">
            <Bot size={18} className="text-warning" /> AI Integrations
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">OpenAI API Key (GPT-4o)</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Google Gemini API Key</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Anthropic Claude API Key</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="password" value={claudeKey} onChange={e => setClaudeKey(e.target.value)} placeholder="sk-ant-..." className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
              </div>
            </div>
          </div>
        </div>

        {/* Jira integration */}
        <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm">
          <div className="text-[14px] font-semibold text-text-main mb-[14px] flex items-center gap-2">
            <Ticket size={18} className="text-primary" /> Jira Integration
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Jira Domain</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="text" value={jiraDomain} onChange={e => setJiraDomain(e.target.value)} placeholder="e.g. company.atlassian.net" className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Jira Email</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="email" value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} placeholder="your.email@company.com" className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">API Token</label>
                <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <input type="password" value={jiraToken} onChange={e => setJiraToken(e.target.value)} placeholder="ATATT3xFf..." className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Project Key</label>
                <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <input type="text" value={jiraProjectKey} onChange={e => setJiraProjectKey(e.target.value)} placeholder="e.g. QA" className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* backup & danger */}
        <div className="flex flex-col gap-[16px]">
          <div className="bg-surface border border-border rounded-[13px] p-[18px] shadow-sm flex items-center gap-[14px]">
            <div className="w-[40px] h-[40px] rounded-[11px] bg-surface-2 flex items-center justify-center shrink-0">
              <Archive size={21} className="text-text-muted" />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-text-main">Export backup</div>
              <div className="text-[12px] text-text-muted mt-[2px]">Download all projects, cases and runs as JSON.</div>
            </div>
            <Button onClick={handleExport} variant="secondary" size="sm">
              <Download size={16} />Export
            </Button>
          </div>

          <div className="bg-surface border border-danger-border rounded-[13px] p-[18px] shadow-sm">
            <div className="flex items-center gap-[7px] text-[14px] font-semibold text-danger mb-[12px]">
              <AlertTriangle size={18} />Danger zone
            </div>
            <div className="flex items-center gap-[12px]">
              <div className="flex-1">
                <div className="text-[13px] font-medium text-text-main">Delete workspace</div>
                <div className="text-[11.5px] text-text-muted mt-[1px]">Permanently removes everything. Cannot be undone.</div>
              </div>
              <Button onClick={() => setConfirmDelete(true)} variant="danger" size="sm">
                <Trash2 size={16} />Delete
              </Button>
            </div>
          </div>
        </div>
        
      </div>

      <div className="flex justify-end gap-[9px] mt-[18px]">
        <Button variant="ghost" size="lg">
          Discard
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="primary" size="lg">
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
          Save changes
        </Button>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-danger-soft flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-main mb-1">
                  Delete workspace
                </h3>
                <p className="text-sm text-text-muted">
                  This permanently deletes all projects, suites, cases and runs.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <label className="block text-[12px] text-text-muted mb-[6px]">
              Type{" "}
              <span className="font-semibold text-text-main">
                {workspaceNameForConfirm}
              </span>{" "}
              to confirm
            </label>
            <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] mb-[16px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
              <input
                autoFocus
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={workspaceNameForConfirm}
                className="w-full bg-transparent outline-none text-text-main font-medium placeholder:font-normal"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteWorkspace}
                disabled={
                  deleting ||
                  deleteConfirmText.trim() !== workspaceNameForConfirm
                }
              >
                {deleting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete workspace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
