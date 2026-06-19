"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import DeploymentLogsModal from "./DeploymentLogsModal";
import { useRouter } from "next/navigation";

export default function DeploymentList({
  initialDeployments,
}: {
  initialDeployments: any[];
}) {
  const [deployments, setDeployments] = useState(initialDeployments);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const router = useRouter();

  const fetchDeployments = async () => {
    try {
      const res = await fetch("/api/deployments");
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const active = deployments.some(
      (d) => d.status === "PENDING" || d.status === "BUILDING",
    );
    if (active) {
      const interval = setInterval(fetchDeployments, 3000);
      return () => clearInterval(interval);
    }
  }, [deployments]);

  const triggerDeployment = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/deployments/trigger", { method: "POST" });
      if (res.ok) {
        await fetchDeployments();
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to trigger deployment");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "FAILED":
        return <XCircle className="text-rose-500" size={18} />;
      case "BUILDING":
        return <Loader2 className="text-primary animate-spin" size={18} />;
      case "PENDING":
        return <Clock className="text-amber-500" size={18} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "FAILED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "BUILDING":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-surface-hover text-text-main border-border";
    }
  };

  const activeDeployment = deployments.some(
    (d) => d.status === "PENDING" || d.status === "BUILDING",
  );

  return (
    <div className="bg-surface border border-border/80 rounded-2xl shadow-premium animate-in zoom-in-95 duration-200">
      <div className="px-6 py-4 border-b border-border/80 flex justify-between items-center">
        <h2 className="font-semibold text-text-main">Recent Deployments</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchDeployments}
            className="p-2 text-text-muted hover:bg-surface-hover rounded-md transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={triggerDeployment}
            disabled={isTriggering || activeDeployment}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-blue-400 text-white text-[13px] font-bold rounded-xl transition-all duration-300 shadow-premium hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isTriggering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Deploy Now
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-hover/70 border-b border-border/80">
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                Trigger
              </th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                Commit
              </th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                Logs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {deployments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No deployments recorded yet.
                </td>
              </tr>
            ) : (
              deployments.map((dep) => (
                <tr
                  key={dep.id}
                  className="hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dep.status)}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(dep.status)}`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-main font-medium">
                    {dep.trigger}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono text-text-main">
                        {dep.commitHash || "N/A"}
                      </span>
                      <span className="text-xs text-text-muted truncate max-w-[200px]">
                        {dep.commitMessage || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {new Date(dep.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLogId(dep.id)}
                      className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-md transition-colors"
                      title="View Logs"
                    >
                      <Terminal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLogId && (
        <DeploymentLogsModal
          deploymentId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </div>
  );
}
