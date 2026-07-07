"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Bug, GitMerge, MessageSquare, CheckCircle2, Copy, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

const INTEGRATION_ICONS: Record<string, LucideIcon> = {
  jira: Bug,
  github: GitMerge,
  teams: MessageSquare,
};

export default function ProjectIntegrationsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    githubOwner: "",
    githubRepo: "",
    githubToken: "",
    githubWorkflowId: "",
    msTeamsWebhookUrl: "",
    webhookUrl: "https://hooks.checkout.dev/qmaster/runs"
  });

  const [integrations, setIntegrations] = useState([
    { id: 'jira', name: 'Jira', desc: 'Create & sync defects with Jira issues', icon: 'bug_report', iconBg: 'var(--primary-soft)', iconColor: 'var(--primary-text)', connected: true, action: 'Configure' },
    { id: 'github', name: 'GitHub', desc: 'Link runs to commits, PRs and checks', icon: 'merge', iconBg: 'var(--surface-2)', iconColor: 'var(--text-main)', connected: true, action: 'Configure' },
    { id: 'teams', name: 'Microsoft Teams', desc: 'Post run summaries to a channel', icon: 'forum', iconBg: 'var(--info-soft)', iconColor: 'var(--info)', connected: false, action: 'Connect' },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${code}/integrations`);
        if (res.ok) {
          const data = await res.json();
          const integ = data.integrations || {};
          setSettings(prev => ({
            ...prev,
            githubOwner: integ.githubOwner || "",
            githubRepo: integ.githubRepo || "",
            githubToken: integ.githubToken || "",
            githubWorkflowId: integ.githubWorkflowId || "",
            msTeamsWebhookUrl: integ.msTeamsWebhookUrl || "",
          }));
          
          setIntegrations(prev => prev.map(i => {
            if (i.id === 'github' && integ.githubOwner) return { ...i, connected: true };
            if (i.id === 'teams' && integ.msTeamsWebhookUrl) return { ...i, connected: true };
            return i;
          }));
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
    try {
      const res = await fetch(`/api/projects/${code}/integrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      toast.success("Integrations saved successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-[6px] text-[17px] font-semibold tracking-[-0.01em] text-text-main">Integrations</div>
      <div className="text-[13.5px] text-text-muted mb-[22px]">Connect QMaster to the tools your team already uses. Defects sync both ways.</div>

      <div className="flex flex-col gap-[14px]">
        {integrations.map((i) => {
          const Icon = INTEGRATION_ICONS[i.id];
          return (
          <div key={i.id} className="flex items-center gap-[15px] p-[16px_18px] bg-surface border border-border rounded-[13px] shadow-sm">
            <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: i.iconBg }}>
              {Icon && <Icon size={23} style={{ color: i.iconColor }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[9px]">
                <span className="text-[14.5px] font-semibold text-text-main">{i.name}</span>
                {i.connected && (
                  <span className="inline-flex items-center gap-[4px] text-[10.5px] font-bold p-[2px_8px] rounded-full bg-success-soft text-success">
                    <CheckCircle2 size={12} />Connected
                  </span>
                )}
              </div>
              <div className="text-[12.5px] text-text-muted mt-[2px]">{i.desc}</div>
            </div>
            <div className="flex items-center gap-[14px]">
              <span className={`text-[12px] font-semibold ${i.connected ? 'text-text-muted' : 'text-primary-text'}`}>{i.action}</span>
              <div 
                className={`w-[44px] h-[24px] rounded-full relative cursor-pointer transition-colors ${i.connected ? 'bg-primary' : 'bg-surface-2'}`}
                onClick={() => toggleIntegration(i.id)}
              >
                <div className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-all ${i.connected ? 'right-[2px]' : 'left-[2px]'}`} />
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-[30px] mb-[6px] text-[15px] font-semibold text-text-main">Webhook</div>
      <div className="text-[13px] text-text-muted mb-[12px]">POST run results to your endpoint on completion.</div>
      <div className="flex gap-[10px] items-center">
        <div className="flex-1 flex items-center h-[42px] px-[14px] rounded-[11px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] font-mono text-[12.5px] text-text-muted focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
           <input type="text" value={settings.webhookUrl} onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})} className="w-full bg-transparent outline-none" />
        </div>
        <Button
          variant="secondary"
          className="h-[42px] rounded-[11px]"
          onClick={() => {
            navigator.clipboard.writeText(settings.webhookUrl);
            toast.success("Copied to clipboard");
          }}
        >
          <Copy size={18} />Copy
        </Button>
      </div>

      {integrations.find(i => i.id === 'github')?.connected && (
        <div className="mt-[30px]">
          <div className="mb-[6px] text-[15px] font-semibold text-text-main">GitHub Setup</div>
          <div className="text-[13px] text-text-muted mb-[12px]">Configure your repository to link runs and issues.</div>
          
          <div className="grid grid-cols-2 gap-[12px] mb-[12px]">
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Owner</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="text" value={settings.githubOwner} onChange={(e) => setSettings({...settings, githubOwner: e.target.value})} placeholder="e.g. torsakun" className="w-full bg-transparent outline-none text-text-main" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Repository</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="text" value={settings.githubRepo} onChange={(e) => setSettings({...settings, githubRepo: e.target.value})} placeholder="e.g. ai_testing" className="w-full bg-transparent outline-none text-text-main" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Access Token</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="password" value={settings.githubToken} onChange={(e) => setSettings({...settings, githubToken: e.target.value})} placeholder="ghp_..." className="w-full bg-transparent outline-none text-text-main" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Workflow File</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                <input type="text" value={settings.githubWorkflowId} onChange={(e) => setSettings({...settings, githubWorkflowId: e.target.value})} placeholder="playwright.yml" className="w-full bg-transparent outline-none text-text-main" />
              </div>
            </div>
          </div>
        </div>
      )}

      {integrations.find(i => i.id === 'teams')?.connected && (
        <div className="mt-[30px]">
          <div className="mb-[6px] text-[15px] font-semibold text-text-main">Microsoft Teams Notifications</div>
          <div className="text-[13px] text-text-muted mb-[12px]">Incoming webhook URL for run summaries.</div>
          <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
            <input type="text" value={settings.msTeamsWebhookUrl} onChange={(e) => setSettings({...settings, msTeamsWebhookUrl: e.target.value})} placeholder="https://your-company.webhook.office.com/..." className="w-full bg-transparent outline-none text-text-main" />
          </div>
        </div>
      )}

      <div className="mt-[28px] flex justify-end gap-[9px]">
        <Button variant="ghost">
          Discard
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
        >
          {!isSaving && <Check size={18} />}
          Save changes
        </Button>
      </div>

    </div>
  );
}
