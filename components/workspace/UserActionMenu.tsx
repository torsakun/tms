"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Key,
  Shield,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
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
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ background: "var(--primary)" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

interface WorkspaceRole {
  id: string;
  title: string;
}

interface UserActionMenuProps {
  userId: string;
  isActive: boolean;
  currentRoleId: string | null;
  roles: WorkspaceRole[];
}

export default function UserActionMenu({
  userId,
  isActive,
  currentRoleId,
  roles,
}: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || "");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    message: string;
    action: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSendResetLink = async () => {
    setIsOpen(false);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspace/users/${userId}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.emailed) {
          toast.success("Password reset link sent to the user's email.", {
            duration: 5000,
          });
        } else {
          // Email not configured — surface the link so the admin can share it manually
          setResetLink(data.resetLink);
        }
      } else {
        toast.error(data.error || "Failed to generate reset link");
      }
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionRequest = (action: string) => {
    setIsOpen(false);
    if (action === "reset_password") {
      setConfirm({
        message: "Reset this user's password to 'password123'?",
        action,
      });
    } else if (action === "deactivate") {
      setConfirm({
        message:
          "Deactivate this user? They will lose access to the workspace.",
        action,
      });
    } else if (action === "activate") {
      setConfirm({ message: "Activate this user?", action });
    } else {
      handleAction(action);
    }
  };

  const handleAction = async (action: string) => {
    setConfirm(null);
    setIsLoading(true);
    setIsOpen(false);
    try {
      const response = await fetch(`/api/workspace/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        if (action === "reset_password") {
          toast.success("Password has been reset to: password123", {
            duration: 5000,
          });
        }
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(`Action failed: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(`Action failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspace/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", roleId: selectedRoleId }),
      });

      if (response.ok) {
        toast.success("User role updated successfully");
        setShowRoleModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(`Role update failed: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(`Role update failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`p-1.5 rounded-md transition-colors ${
            isOpen
              ? "bg-slate-200 text-text-main"
              : "text-text-muted hover:text-text-muted hover:bg-surface-hover"
          }`}
        >
          <MoreHorizontal size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-surface rounded-md shadow-lg border border-border py-1 z-50">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowRoleModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center space-x-2"
            >
              <Shield size={16} className="text-primary" />
              <span>Edit Role</span>
            </button>
            <button
              onClick={handleSendResetLink}
              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center space-x-2"
            >
              <Key size={16} className="text-amber-500" />
              <span>Send password reset</span>
            </button>

            <div className="h-px bg-slate-200 my-1 mx-2" />

            {isActive ? (
              <button
                onClick={() => handleActionRequest("deactivate")}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
              >
                <UserX size={16} className="text-rose-500" />
                <span>Deactivate User</span>
              </button>
            ) : (
              <button
                onClick={() => handleActionRequest("activate")}
                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2 font-medium"
              >
                <UserCheck size={16} className="text-emerald-500" />
                <span>Activate User</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => handleAction(confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Reset link modal (email not configured — share manually) */}
      {resetLink && (
        <div
          className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
          onClick={() => setResetLink(null)}
        >
          <div
            className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-text-main mb-2 flex items-center gap-2">
              <Key size={18} className="text-amber-500" /> Password reset link
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Email isn&apos;t configured, so share this link with the user
              directly. It expires in 24 hours.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={resetLink}
                className="flex-1 px-3 py-2 text-xs bg-surface-hover border border-border rounded-lg text-text-muted truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(resetLink);
                  toast.success("Link copied");
                }}
                className="px-3 py-2 text-sm font-semibold text-white rounded-lg shadow-sm shrink-0"
                style={{
                  background: "var(--primary)",
                }}
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setResetLink(null)}
                className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-hover hover:bg-slate-200 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text-main mb-4">
              Edit User Role
            </h3>

            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-text-main mb-2">
                Role
              </label>
              <div className="relative">
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full appearance-none bg-surface border border-text-muted text-text-main py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-3 text-text-muted pointer-events-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-sm font-medium text-text-muted bg-surface-hover hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleSave}
                disabled={
                  isLoading ||
                  !selectedRoleId ||
                  selectedRoleId === currentRoleId
                }
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
