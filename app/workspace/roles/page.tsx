"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, MoreHorizontal, Loader2 } from "lucide-react";

export default function WorkspaceRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchRoles = () => {
    fetch("/api/workspace/roles")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRoles(data.roles);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/roles/${id}/default`, {
        method: "POST"
      });
      if (res.ok) {
        fetchRoles();
      }
    } catch (e) {
      console.error("Error setting default role", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`/api/workspace/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRoles();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete role");
      }
    } catch (err) {
      console.error("Error deleting role", err);
      alert("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8">
      <h1 className="text-2xl font-bold text-text-main mb-6">User Roles</h1>

      {/* Toolbar */}
      <div className="flex items-center mb-6">
        <Link 
          href="/workspace/roles/create"
          className="bg-[#2563eb] hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Create a new role
        </Link>
      </div>

      {/* Roles Table */}
      <div className="overflow-visible pb-32">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider text-center w-24">System</th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider text-center w-24">Default</th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-32">Users</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-text-main text-sm">{role.title}</span>
                    <span className="text-xs text-text-muted mt-1">{role.description}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  {role.isSystem && (
                    <Check size={16} className="text-emerald-500 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  {role.isDefault && (
                    <Check size={16} className="text-emerald-500 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-text-main font-medium">
                  {role._count?.users || 0} {(role._count?.users || 0) === 1 ? "user" : "users"}
                </td>
                <td className="px-4 py-4 text-right relative">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setOpenMenuId(openMenuId === role.id ? null : role.id);
                    }}
                    className="text-text-muted hover:text-text-muted p-1 rounded hover:bg-slate-200"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {openMenuId === role.id && (
                    <div className="absolute right-8 top-10 w-48 bg-surface rounded-md shadow-lg border border-border z-50 py-1 text-left">
                      <Link 
                        href={`/workspace/roles/${role.id}`}
                        className="block px-4 py-2 text-sm text-text-main hover:bg-surface-hover transition-colors"
                      >
                        View
                      </Link>
                      {!role.isSystem && (
                        <Link 
                          href={`/workspace/roles/${role.id}`}
                          className="block px-4 py-2 text-sm text-text-main hover:bg-surface-hover transition-colors"
                        >
                          Update
                        </Link>
                      )}
                      {!role.isDefault && !role.isSystem && (
                        <button 
                          onClick={() => handleSetDefault(role.id)}
                          className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover transition-colors"
                        >
                          Set default role
                        </button>
                      )}
                      {!role.isSystem && (
                        <button 
                          onClick={() => handleDelete(role.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-border pt-1"
                        >
                          Delete role
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
