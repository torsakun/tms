"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface InviteUserModalProps {
  onClose: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [access, setAccess] = useState(false);

  React.useEffect(() => {
    setIsLoadingRoles(true);
    fetch("/api/workspace/roles")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.roles && data.roles.length > 0) {
          setRoles(data.roles);
          const defaultRole = data.roles.find((r: any) => r.isDefault);
          setRoleId(defaultRole ? defaultRole.id : data.roles[0].id);
        } else {
          console.warn("No roles returned from API", data);
        }
      })
      .catch(err => console.error("Failed to fetch roles", err))
      .finally(() => setIsLoadingRoles(false));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          roleTitle,
          roleId
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-text-main">Invite new user</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-text-muted hover:bg-surface-hover hover:text-text-main rounded-md p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Tabs */}
        <div className="px-6 border-b border-border flex space-x-6">
          <button 
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "single" 
                ? "border-blue-700 text-text-main" 
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
            onClick={() => setActiveTab("single")}
          >
            Single
          </button>
          <button 
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "bulk" 
                ? "border-blue-700 text-text-main" 
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
            onClick={() => setActiveTab("bulk")}
          >
            Bulk
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "single" ? (
            <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100 flex items-center">
                  <CheckCircle2 size={16} className="mr-2" />
                  Invitation sent successfully! Check terminal for the link.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="For example: John"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="For example: Smith"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  Role title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="For example: Senior QA"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                {isLoadingRoles ? (
                  <div className="flex items-center text-sm text-text-muted py-2">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading roles...
                  </div>
                ) : roles.length > 0 ? (
                  <select
                    value={roleId}
                    required
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-surface"
                    style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%2364748b"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
                  >
                    <option value="" disabled>Select a role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-red-500 py-2">
                    No workspace roles found. Please create a role first or contact support.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input 
                      type="checkbox" 
                      checked={readOnly}
                      onChange={(e) => setReadOnly(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-text-muted rounded peer-checked:bg-primary peer-checked:border-blue-600 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm text-text-main">Read-only</span>
                </label>
              </div>

              <div>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={access}
                      onChange={(e) => setAccess(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-text-muted rounded peer-checked:bg-primary peer-checked:border-blue-600 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">Access</span>
                    <span className="text-xs text-text-muted">A user will receive access to all private projects in your workspace.</span>
                  </div>
                </label>
              </div>
            </form>
          ) : (
            <div className="text-sm text-text-muted">
              Bulk invite functionality is not available yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end px-6 py-4 shrink-0 space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-main bg-surface-hover hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            form="invite-user-form"
            type="submit"
            disabled={isSubmitting || success || isLoadingRoles || !roleId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4338ca] hover:bg-[#3730a3] disabled:opacity-50 rounded-md transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Sending...
              </>
            ) : "Invite"}
          </button>
        </footer>
      </div>
    </div>
  );
}
