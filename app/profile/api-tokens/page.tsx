"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Copy, KeyRound, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatThaiTime } from "@/lib/utils";

type ApiToken = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  // Held only until the user dismisses it — never fetched again.
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiToken | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/profile/api-tokens");
      if (res.ok) setTokens(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Give the token a name so you can recognise it later");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/profile/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...(expiresInDays ? { expiresInDays: Number(expiresInDays) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create the token");
        return;
      }
      setFreshToken(data.token);
      setShowCreate(false);
      setName("");
      setExpiresInDays("");
      load();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (token: ApiToken) => {
    const res = await fetch(`/api/profile/api-tokens/${token.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Revoked "${token.name}"`);
      setTokens((t) => t.filter((x) => x.id !== token.id));
    } else {
      toast.error("Could not revoke the token");
    }
    setRevoking(null);
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex min-h-[600px] w-full flex-col bg-background text-[14px] leading-[1.45] text-text-main antialiased font-sans">
      {/* Header spans the window for its border, but its contents sit in the
          same centred column as the table below — otherwise the title hugs the
          left edge while the table floats mid-screen on a wide monitor. */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-[900px] p-[18px_22px]">
          <div className="flex items-center gap-[10px]">
            <Link
              href="/profile"
              className="flex items-center gap-[5px] text-[13px] font-medium text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronLeft size={16} /> Profile
            </Link>
          </div>
          <div className="mt-[6px] flex items-start justify-between gap-4">
            <div className="max-w-[620px]">
              <div className="text-[18px] font-semibold tracking-[-0.01em]">API tokens</div>
              <div className="mt-0.5 text-[13px] leading-[1.6] text-text-muted">
                Reach the REST API at{" "}
                <code className="qm-mono text-[12.5px] bg-surface-hover px-[5px] py-[1px] rounded">
                  /api/v1
                </code>{" "}
                from CI or a script. A token acts as you, so it can do exactly what your account
                can.{" "}
                <Link href="/docs/api" className="text-primary hover:underline underline-offset-2">
                  Read the API reference
                </Link>
                .
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New token
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-[24px_22px]">
      <div className="mx-auto max-w-[900px]">

      {freshToken && (
        <div className="mb-[20px] rounded-[12px] border border-primary/30 bg-primary-light/40 p-[16px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-[14px] mb-[4px]">
                Copy your token now — it will not be shown again
              </div>
              <div className="text-[12.5px] text-text-muted mb-[10px]">
                Store it in your CI secrets. If you lose it, revoke it and create a new one.
              </div>
              <code className="qm-mono text-[12.5px] block bg-surface border border-border rounded-[8px] px-[12px] py-[9px] break-all">
                {freshToken}
              </code>
            </div>
            <button
              onClick={() => setFreshToken(null)}
              className="text-text-faint hover:text-text-main shrink-0"
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-[10px]">
            <Button size="sm" variant="secondary" onClick={() => copy(freshToken)}>
              <Copy size={14} /> Copy token
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-[12px] border border-border overflow-hidden bg-surface">
        <div className="grid grid-cols-[1fr_150px_150px_150px_44px] gap-[12px] px-[16px] py-[9px] text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint border-b border-border bg-surface-hover/40">
          <div>Name</div>
          <div>Token</div>
          <div>Last used</div>
          <div>Expires</div>
          <div />
        </div>

        {loading ? (
          <div className="px-[16px] py-[24px] text-[13px] text-text-faint">Loading…</div>
        ) : tokens.length === 0 ? (
          <div className="px-[16px] py-[32px] text-center">
            <KeyRound size={26} className="mx-auto text-text-faint mb-[8px]" />
            <div className="text-[13.5px] text-text-muted">
              No tokens yet. Create one to start using the API.
            </div>
          </div>
        ) : (
          tokens.map((t) => {
            const expired = t.expiresAt && new Date(t.expiresAt) < new Date();
            return (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_150px_150px_150px_44px] gap-[12px] px-[16px] py-[11px] items-center border-b border-border last:border-0 text-[13px]"
              >
                <div className="font-medium truncate" title={t.name}>
                  {t.name}
                </div>
                <div className="qm-mono text-[12px] text-text-faint">{t.prefix}…</div>
                <div className="text-[12.5px] text-text-muted">
                  {t.lastUsedAt ? formatThaiTime(t.lastUsedAt) : "never"}
                </div>
                <div className={`text-[12.5px] ${expired ? "text-danger" : "text-text-muted"}`}>
                  {t.expiresAt ? (expired ? "expired" : formatThaiTime(t.expiresAt)) : "never"}
                </div>
                <button
                  onClick={() => setRevoking(t)}
                  title="Revoke"
                  className="justify-self-end text-text-faint hover:text-danger transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[color:var(--overlay)] p-4">
          <div className="bg-surface rounded-[12px] shadow-xl w-full max-w-[440px] overflow-hidden">
            <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-border">
              <h2 className="font-bold text-[16px]">New API token</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-faint hover:text-text-main">
                <X size={18} />
              </button>
            </div>
            <div className="px-[20px] py-[18px] space-y-[14px]">
              <div>
                <label className="block text-[13px] font-medium mb-[6px]">Name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="GitHub Actions"
                  className="w-full h-[38px] px-[12px] rounded-[9px] border border-border bg-surface text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-[6px]">
                  Expires in (days) <span className="text-text-faint font-normal">— optional</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="leave empty for no expiry"
                  className="w-full h-[38px] px-[12px] rounded-[9px] border border-border bg-surface text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                />
              </div>
            </div>
            <div className="px-[20px] py-[14px] bg-surface-hover border-t border-border flex justify-end gap-[10px]">
              <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={creating}>
                Create token
              </Button>
            </div>
          </div>
        </div>
      )}

      {revoking && (
        <ConfirmDialog
          title={`Revoke "${revoking.name}"`}
          message="Anything using this token will stop working immediately. This cannot be undone."
          confirmLabel="Revoke"
          variant="danger"
          onConfirm={() => handleRevoke(revoking)}
          onCancel={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
