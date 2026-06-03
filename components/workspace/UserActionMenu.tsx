"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, UserX, UserCheck, Key, Shield, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function UserActionMenu({ userId, isActive, currentRoleId, roles }: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || "");
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (action: string) => {
    if (action === "reset_password") {
      const confirmReset = window.confirm("Are you sure you want to reset this user's password to 'password123'?");
      if (!confirmReset) return;
    }

    if (action === "deactivate" || action === "activate") {
      const actionText = action === "deactivate" ? "deactivate" : "activate";
      const confirmAction = window.confirm(`Are you sure you want to ${actionText} this user?`);
      if (!confirmAction) return;
    }

    setIsLoading(true);
    setIsOpen(false);
    try {
      const response = await fetch(`/api/workspace/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      if (action === "reset_password") {
        alert("Password has been reset to: password123");
      }
      
      router.refresh();
    } catch (error: any) {
      alert(`Action failed: ${error.message}`);
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
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setShowRoleModal(false);
      router.refresh();
    } catch (error: any) {
      alert(`Role update failed: ${error.message}`);
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
            isOpen ? "bg-slate-200 text-text-main" : "text-text-muted hover:text-text-muted hover:bg-surface-hover"
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
              onClick={() => handleAction("reset_password")}
              className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center space-x-2"
            >
              <Key size={16} className="text-amber-500" />
              <span>Reset Password</span>
            </button>
            
            <div className="h-px bg-slate-200 my-1 mx-2" />
            
            {isActive ? (
              <button
                onClick={() => handleAction("deactivate")}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
              >
                <UserX size={16} className="text-rose-500" />
                <span>Deactivate User</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction("activate")}
                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2 font-medium"
              >
                <UserCheck size={16} className="text-emerald-500" />
                <span>Activate User</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text-main mb-4">Edit User Role</h3>
            
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-text-main mb-2">
                Workspace Role
              </label>
              <div className="relative">
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full appearance-none bg-surface border border-text-muted text-text-main py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                >
                  <option value="" disabled>Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
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
                disabled={isLoading || !selectedRoleId || selectedRoleId === currentRoleId}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
