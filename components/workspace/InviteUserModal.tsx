"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InviteUserModalProps {
  onClose: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleBulkInvite = async () => {
    setError("");
    setBulkResult(null);
    const emails = Array.from(
      new Set(
        bulkText
          .split(/[\n,;\s]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    const valid = emails.filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
    if (valid.length === 0) {
      setError("Enter at least one valid email address.");
      return;
    }
    setBulkBusy(true);
    let sent = 0;
    let failed = 0;
    for (const em of valid) {
      try {
        const r = await fetch("/api/workspace/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, roleId }),
        });
        r.ok ? sent++ : failed++;
      } catch {
        failed++;
      }
    }
    setBulkBusy(false);
    setBulkResult({ sent, failed });
    if (sent > 0) setTimeout(onClose, 1800);
  };

  React.useEffect(() => {
    fetch("/api/workspace/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.roles?.length > 0) {
          setRoles(data.roles);
          const def = data.roles.find((r: any) => r.isDefault);
          setRoleId(def ? def.id : data.roles[0].id);
        }
      })
      .catch((err) => console.error("Failed to fetch roles", err))
      .finally(() => setIsLoadingRoles(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, roleId }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send invitation");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-text-main placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all";
  const labelCls = "block text-sm font-semibold text-text-main mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color:oklch(0.18_0.015_264)]/40 backdrop-blur-[1px]">
      <div className="bg-surface rounded-[13px] shadow-[var(--shadow-dialog)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <UserPlus size={15} className="text-primary" />
            </div>
            <h2 className="text-base font-bold text-text-main">
              Invite new member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-muted hover:bg-surface-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-border flex gap-5 shrink-0">
          {(["single", "bulk"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "single" ? (
            <form
              id="invite-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 text-sm text-danger bg-danger-soft rounded-lg border border-danger/15">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-success bg-success-soft rounded-lg border border-success/15 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Invitation sent successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    First name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Last name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.smith@company.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Role <span className="text-danger">*</span>
                </label>
                {isLoadingRoles ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted py-2.5">
                    <Loader2 size={14} className="animate-spin" /> Loading
                    roles…
                  </div>
                ) : (
                  <select
                    value={roleId}
                    required
                    onChange={(e) => setRoleId(e.target.value)}
                    className={inputCls + " appearance-none cursor-pointer"}
                    style={{
                      backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%2364748b"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>')`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                )}
                {roleId && roles.length > 0 && (
                  <p className="text-xs text-text-muted mt-1.5">
                    {roles.find((r) => r.id === roleId)?.description}
                  </p>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-danger bg-danger-soft rounded-lg border border-danger/15">
                  {error}
                </div>
              )}
              {bulkResult && (
                <div className="p-3 text-sm rounded-lg border bg-success-soft border-success/15 text-success-foreground">
                  Sent {bulkResult.sent} invitation
                  {bulkResult.sent !== 1 ? "s" : ""}
                  {bulkResult.failed > 0 && (
                    <span className="text-danger">
                      {" "}
                      · {bulkResult.failed} failed (already a member / invalid)
                    </span>
                  )}
                </div>
              )}
              <div>
                <label className={labelCls}>
                  Email addresses <span className="text-danger">*</span>
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  placeholder={"alice@company.com\nbob@company.com, carol@company.com"}
                  className={inputCls + " resize-y font-mono text-[13px]"}
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Separate by new line, comma, or space. Names are derived from
                  each address.
                </p>
              </div>
              <div>
                <label className={labelCls}>
                  Role <span className="text-danger">*</span>
                </label>
                {isLoadingRoles ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted py-2.5">
                    <Loader2 size={14} className="animate-spin" /> Loading roles…
                  </div>
                ) : (
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className={inputCls + " appearance-none cursor-pointer"}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          {activeTab === "single" ? (
            <Button
              form="invite-form"
              type="submit"
              disabled={success || isLoadingRoles || !roleId}
              loading={isSubmitting}
            >
              {isSubmitting ? "Sending…" : "Invite"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleBulkInvite}
              disabled={isLoadingRoles || !roleId || !bulkText.trim()}
              loading={bulkBusy}
            >
              {bulkBusy ? "Sending…" : "Send invites"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
