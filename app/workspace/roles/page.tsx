"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  MoreHorizontal,
  Plus,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeleton";

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
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-1">
              Delete role
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchRoles = () => {
    fetch("/api/workspace/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRoles(data.roles);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/roles/${id}/default`, {
        method: "POST",
      });
      if (res.ok) {
        fetchRoles();
        toast.success("Default role updated");
      } else toast.error("Failed to update default role");
    } catch {
      toast.error("Failed to update default role");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    const backup = [...roles];
    setRoles((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/workspace/roles/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Role deleted successfully");
      } else {
        const d = await res.json();
        setRoles(backup);
        toast.error(d.error || "Failed to delete role");
      }
    } catch {
      setRoles(backup);
      toast.error("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="skeleton h-6 w-24" />
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            Roles
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
            {roles.length}
          </span>
        </div>
        <Link
          href="/workspace/roles/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={15} /> New role
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-visible bg-surface border border-border shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-hover/80">
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-24 text-center">
                System
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-24 text-center">
                Default
              </th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider w-28">
                Members
              </th>
              <th className="pr-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.id}
                className="border-b border-border last:border-0 hover:bg-surface-hover/70 transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Shield size={15} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-main">
                        {role.title}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5 max-w-md truncate">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  {role.isSystem && (
                    <Check
                      size={15}
                      className="text-emerald-500 mx-auto"
                      strokeWidth={3}
                    />
                  )}
                </td>
                <td className="px-5 py-4 text-center">
                  {role.isDefault && (
                    <Check
                      size={15}
                      className="text-emerald-500 mx-auto"
                      strokeWidth={3}
                    />
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-muted font-medium">
                    {role._count?.users || 0}{" "}
                    {(role._count?.users || 0) === 1 ? "member" : "members"}
                  </span>
                </td>
                <td className="pr-4 py-4 text-right relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setOpenMenuId(openMenuId === role.id ? null : role.id);
                    }}
                    className="p-1.5 rounded-md text-slate-300 group-hover:text-text-muted hover:bg-surface-hover transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openMenuId === role.id && (
                    <div
                      className="absolute right-8 top-10 w-48 bg-surface rounded-xl py-1 z-50 overflow-hidden"
                      style={{
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Link
                        href={`/workspace/roles/${role.id}`}
                        className="block px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors text-left"
                      >
                        Edit
                      </Link>
                      {!role.isDefault && (
                        <button
                          onClick={() => handleSetDefault(role.id)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors"
                        >
                          Set as default
                        </button>
                      )}
                      <div className="h-px bg-surface-hover mx-2 my-1" />
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setConfirmDelete({ id: role.id, title: role.title });
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.title}"? Users assigned this role will be moved to the default role.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
