"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Send,
  Mail,
  Clock,
  History,
  RefreshCw,
  Ban,
  UserPlus,
  ChevronDown,
  Loader2,
} from "lucide-react";

export default function WorkspaceInvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"SINGLE" | "BULK">("SINGLE");
  
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchInvites = () => {
    fetch("/api/workspace/invites")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvites(data.invites);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };
  
  const fetchRoles = () => {
    fetch("/api/workspace/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoles(data.roles);
          const defRole = data.roles.find((r: any) => r.isDefault);
          if (defRole) setRoleId(defRole.id);
          else if (data.roles.length > 0) setRoleId(data.roles[0].id);
        }
      });
  };

  useEffect(() => {
    fetchInvites();
    fetchRoles();
  }, []);

  const openInvite = () => {
    setEmail("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/workspace/invites/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invitation revoked");
        fetchInvites();
      } else {
        toast.error("Failed to revoke invitation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  
  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/invites/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Invitation resent");
        fetchInvites();
      } else {
        toast.error("Failed to resend invitation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleSendInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roleId }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        toast.success("Invitation sent");
        fetchInvites();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send invitation");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired) return { status: 'Expired', bg: 'var(--surface-2)', color: 'var(--text-faint)', Icon: History };
    return { status: 'Pending', bg: 'var(--warn-soft)', color: 'var(--warn)', Icon: Clock };
  };

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1060px] mx-auto p-[20px_22px] flex justify-center min-h-[400px] items-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1060px] mx-auto p-[20px_22px] antialiased font-sans">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div className="text-[16px] font-semibold text-text-main">
          Pending invites <span className="text-text-faint font-normal">· {invites.length}</span>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={openInvite}>
          <Send size={15} />
          Invite new member
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_120px_110px_80px] gap-[14px] p-[10px_18px] text-[10.5px] font-semibold tracking-[0.06em] uppercase text-text-faint border-b border-border bg-surface-hover/30">
          <div>Email</div>
          <div>Role</div>
          <div>Invited</div>
          <div>Status</div>
          <div></div>
        </div>
        
        {invites.map((inv) => {
          const st = getStatusStyle(inv.expiresAt);
          return (
            <div key={inv.id} className="grid grid-cols-[2fr_1fr_120px_110px_80px] gap-[14px] p-[13px_18px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors group">
              <div className="flex items-center gap-[10px] min-w-0">
                <div className="w-[28px] h-[28px] rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-text-faint" />
                </div>
                <span className="text-[13px] font-medium text-text-main truncate">{inv.email}</span>
              </div>
              <div>
                <span className="text-[11.5px] font-semibold p-[3px_9px] rounded-[7px] bg-surface-2 text-text-muted">
                  {inv.accessRoleName || "Member"}
                </span>
              </div>
              <div className="text-[12px] text-text-muted">{formatTimeAgo(inv.createdAt)}</div>
              <div>
                <span className="inline-flex items-center gap-[5px] text-[11px] font-bold p-[2px_9px] rounded-full" style={{ background: st.bg, color: st.color }}>
                  <st.Icon size={12} />
                  {st.status}
                </span>
              </div>
              <div className="flex gap-[10px] justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleResend(inv.id)} className="text-text-faint hover:text-text-main flex items-center" title="Resend"><RefreshCw size={16} /></button>
                <button onClick={() => setConfirmDeleteId(inv.id)} className="text-text-faint hover:text-danger flex items-center" title="Revoke"><Ban size={16} /></button>
              </div>
            </div>
          );
        })}

        {invites.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <Mail size={30} className="text-text-muted mb-2" />
            <div className="text-[14px] font-semibold text-text-main">No pending invites</div>
          </div>
        )}
      </div>

      {/* invite modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[54px]" style={{ background: "color(display-p3 0 0 0 / 0.4)" }} onClick={() => setIsModalOpen(false)}>
          <div 
            className="w-[440px] bg-surface border border-border rounded-[15px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-[10px] p-[18px_20px_14px]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-soft text-primary-text flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <div className="text-[15.5px] font-semibold text-text-main">Invite members</div>
            </div>
            
            <div className="flex gap-[3px] m-[0_20px] bg-surface-2 border border-border rounded-[9px] p-[3px]">
              <button 
                onClick={() => setActiveTab("SINGLE")}
                className="flex-1 text-center py-[6px] rounded-[7px] text-[12.5px] transition-all"
                style={{
                  background: activeTab === "SINGLE" ? "var(--surface)" : "transparent",
                  fontWeight: activeTab === "SINGLE" ? "600" : "500",
                  color: activeTab === "SINGLE" ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: activeTab === "SINGLE" ? "var(--shadow-sm)" : "none"
                }}
              >
                Single
              </button>
              <button 
                onClick={() => setActiveTab("BULK")}
                className="flex-1 text-center py-[6px] rounded-[7px] text-[12.5px] transition-all cursor-not-allowed opacity-60"
                style={{
                  background: activeTab === "BULK" ? "var(--surface)" : "transparent",
                  fontWeight: activeTab === "BULK" ? "600" : "500",
                  color: activeTab === "BULK" ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: activeTab === "BULK" ? "var(--shadow-sm)" : "none"
                }}
                disabled
                title="Bulk invite coming soon"
              >
                Bulk paste
              </button>
            </div>
            
            <div className="p-[16px_20px] flex flex-col gap-[14px]">
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Email address</label>
                <div className="flex items-center gap-[9px] h-[42px] px-[13px] rounded-[11px] bg-surface shadow-[inset_0_0_0_2px_var(--ring)] text-[14px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <Mail size={17} className="text-text-faint shrink-0" />
                  <input
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="new.hire@example.com"
                    className="w-full bg-transparent outline-none text-text-main"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Role</label>
                <div className="flex items-center h-[42px] px-[13px] rounded-[11px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <select
                    value={roleId}
                    onChange={e => setRoleId(e.target.value)}
                    className="w-full bg-transparent outline-none text-text-main appearance-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} className="text-text-faint pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-[9px] p-[14px_20px] border-t border-border bg-surface">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendInvite} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                Send invite
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Revoke this invitation? The invite link will no longer work."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
