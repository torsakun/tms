"use client";

import React, { useState, useEffect, use } from "react";
import { Activity, PlusCircle, Trash2, Edit2, PlayCircle, Share2, FileText, Loader2, Settings } from "lucide-react";
import { format } from "date-fns";
import { formatThaiTime } from "@/lib/utils";

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function AuditLogsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/projects/${code}/audit`);
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        const data = await res.json();
        setLogs(data.logs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [code]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED": return <PlusCircle size={16} className="text-emerald-500" />;
      case "DELETED": return <Trash2 size={16} className="text-red-500" />;
      case "UPDATED": return <Edit2 size={16} className="text-primary" />;
      case "EXECUTED": return <PlayCircle size={16} className="text-purple-500" />;
      case "SHARED": return <Share2 size={16} className="text-amber-500" />;
      default: return <Activity size={16} className="text-text-muted" />;
    }
  };

  const getEntityLabel = (entity: string) => {
    return entity.replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-main flex items-center">
          <Activity className="mr-3 text-primary" />
          Audit Logs & Activity
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Track all major actions and changes within this project.
        </p>
      </header>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Activity size={48} className="mx-auto mb-4 opacity-20" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-surface-hover transition-colors flex items-start space-x-4">
                <div className="mt-1 bg-surface p-2 rounded-full border border-border shadow-sm">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-main">
                    <span className="font-semibold text-text-main">{log.user.name || log.user.email}</span>
                    <span className="text-text-muted mx-1">{log.action.toLowerCase()}</span>
                    <span className="font-medium text-text-main">{getEntityLabel(log.entity)}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-text-muted mt-1 truncate">
                      {log.details}
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-2">
                    {formatThaiTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
