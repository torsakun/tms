"use client";

import React, { useState } from "react";
import { UserPlus, ShieldHalf, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function MembersListClient({ initialMembers, projectCode }: { initialMembers: any[], projectCode: string }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectCode}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      setMessage({ text: "Invitation sent successfully!", type: "success" });
      setEmail("");
      // Hide modal after a brief delay
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage(null);
      }, 2000);
      
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center">
            Project Members
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage who has access to {projectCode} and their roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-hover transition"
        >
          <UserPlus size={16} className="mr-2" />
          Invite Member
        </button>
      </header>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-hover border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Member Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Project Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialMembers.map(m => (
              <tr key={m.id} className="hover:bg-surface-hover transition">
                <td className="px-6 py-4">
                  <div className="font-semibold text-text-main">{m.user.name || "Unknown"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">{m.user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                    m.role === "ADMIN" ? "bg-amber-100 text-amber-800" : 
                    m.role === "EDITOR" ? "bg-blue-100 text-blue-800" : "bg-surface-hover text-text-muted"
                  }`}>
                    {m.role === "ADMIN" && <ShieldHalf size={12} className="mr-1" />}
                    {m.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button className="text-primary hover:text-blue-800 text-sm font-medium">Edit Role</button>
                  <button className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                </td>
              </tr>
            ))}
            {initialMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                  No members found. Invite someone to collaborate!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-hover">
              <h2 className="text-lg font-bold text-text-main">Invite to Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-muted">✕</button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-text-muted" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-3 py-2 border border-text-muted rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Project Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-text-muted rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="EDITOR">Editor (Can create/edit tests)</option>
                  <option value="ADMIN">Admin (Full project control)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-text-muted rounded-md text-sm font-medium text-text-main hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Mail size={16} className="mr-2" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
