"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, MoreHorizontal, Mail, Clock } from "lucide-react";
import { InviteUserModal } from "@/components/workspace/InviteUserModal";

export default function WorkspaceInvitesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
      if (data.success) {
        setInvites(data.invites);
      }
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
    if (!confirm("Are you sure you want to delete this invitation?")) return;
    try {
      const res = await fetch(`/api/workspace/invites/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInvites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/invites/${id}/resend`, { method: "POST" });
      if (res.ok) {
        alert("Invitation resent! Check terminal for the link.");
        fetchInvites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8 relative">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Invites</h1>

      {/* Toolbar */}
      <div className="flex items-center mb-6 space-x-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4338ca] hover:bg-[#3730a3] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Invite new member
        </button>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search invites"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12 bg-white border border-slate-200 rounded-lg border-dashed">
            No pending invites.
          </p>
        ) : (
          <div className="border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Sent At</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Expires At</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <Mail size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700 text-sm">{invite.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{invite.accessRoleName || "Member"}</span>
                        {invite.roleTitle && (
                          <span className="text-xs text-slate-500 mt-0.5">{invite.roleTitle}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-amber-600 text-sm space-x-1.5 font-medium">
                        <Clock size={14} />
                        <span>{new Date(invite.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            setOpenMenuId(openMenuId === invite.id ? null : invite.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 focus:outline-none"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {openMenuId === invite.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10 py-1">
                            <button 
                              onClick={() => handleResend(invite.id)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Resend invitation
                            </button>
                            <button 
                              onClick={() => handleDelete(invite.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete invitation
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <InviteUserModal onClose={() => {
          setIsModalOpen(false);
          fetchInvites(); // Refresh list after modal closes
        }} />
      )}
    </div>
  );
}
