"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  MoreHorizontal,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { InviteUserModal } from "@/components/workspace/InviteUserModal";

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl shadow-premium border border-border/80 w-full max-w-sm p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-1">
              Confirm action
            </h3>
            <p className="text-sm text-text-muted">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-hover hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceInvitesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "delete";
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/workspace/invites");
      const data = await res.json();
      if (data.success) setInvites(data.invites);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleDelete = async (id: string) => {
    setConfirm(null);
    try {
      const res = await fetch(`/api/workspace/invites/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Invitation deleted");
        fetchInvites();
      } else {
        toast.error("Failed to delete invitation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleResend = async (id: string) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/workspace/invites/${id}/resend`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Invitation resent successfully");
        fetchInvites();
      } else {
        toast.error("Failed to resend invitation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const now = new Date();
  const filtered = invites.filter(
    (inv) =>
      !search.trim() ||
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      (inv.accessRoleName || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            Invites
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {invites.length}
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-premium hover:-translate-y-0.5 transition-all duration-300"
          style={{ background: "var(--primary)" }}
        >
          Invite new member
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={15}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or role…"
            className="w-full pl-9 pr-4 py-2.5 text-[13px] font-semibold border border-border/80 rounded-xl bg-surface-hover/50 text-text-main placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-inner hover:border-text-muted/40"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border/80 shadow-premium py-16 text-center animate-in zoom-in-95 duration-200">
          <Mail size={28} className="text-text-muted/60 mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-muted">
            {search ? "No invites match your search" : "No pending invites"}
          </p>
          {!search && (
            <p className="text-xs text-text-muted mt-1">
              Invited members will appear here until they accept.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-visible bg-surface border border-border/80 shadow-premium animate-in zoom-in-95 duration-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-hover/70">
                <th className="px-5 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((invite, i) => {
                const isExpired = new Date(invite.expiresAt) < now;
                return (
                  <tr
                    key={invite.id}
                    className={`border-b border-border/80 last:border-0 hover:bg-surface-hover/70 transition-colors group`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <Mail size={13} className="text-indigo-400" />
                        </div>
                        <span className="text-[15px] font-bold text-text-main">
                          {invite.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-semibold text-text-muted">
                        {invite.accessRoleName || "Member"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-medium text-text-muted">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100">
                          <Clock size={11} /> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-amber-600">
                          <Clock size={13} />
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="pr-4 py-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          setOpenMenuId(
                            openMenuId === invite.id ? null : invite.id,
                          );
                        }}
                        className="p-1.5 rounded-xl text-text-muted/60 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === invite.id && (
                        <div className="absolute right-8 top-10 w-48 bg-surface rounded-xl py-1 z-50 overflow-hidden shadow-premium border border-border/80 animate-in zoom-in-95 duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResend(invite.id);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-indigo-400"
                            />{" "}
                            Resend invitation
                          </button>
                          <div className="h-px bg-surface-hover mx-2 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setConfirm({ id: invite.id, action: "delete" });
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            Delete invitation
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <InviteUserModal
          onClose={() => {
            setIsModalOpen(false);
            fetchInvites();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          message="Delete this invitation? The invite link will no longer work."
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
