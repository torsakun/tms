"use client";

import { useState, useEffect } from "react";
import { Play, Terminal, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import DeploymentLogsModal from "./DeploymentLogsModal";
import { useRouter } from "next/navigation";

export default function DeploymentList({ initialDeployments }: { initialDeployments: any[] }) {
  const [deployments, setDeployments]] = useState(initialDeployments);
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
    const active = deployments.some(d => d.status === "PENDING" || d.status === "BUILDING");
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
      case "SUCCESS": return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "FAILED": return <XCircle className="text-rose-500" size={18} />;
      case "BUILDING": return <Loader2 className="text-blue-500 animate-spin" size={18} />;
      case "PENDING": return <Clock className="text-amber-500" size={18} />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "FAILED": return "bg-rose-100 text-rose-700 border-rose-200";
      case "BUILDING": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const activeDeployment = deployments.some(d => d.status === "PENDING" || d.status === "BUILDING");

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Recent Deployments</h2>
        <div className="flex gap-2">
          <button 
            onClick={fetchDeployments}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={triggerDeployment}
            disabled={isTriggering || activeDeployment}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            {isTriggering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Deploy Now
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Trigger</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Commit</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Logs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deployments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No deployments recorded yet.
                </td>
              </tr>
            ) : deployments.map((dep) => (
              <tr key={dep.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dep.status)}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(dep.status)}`}>
                      {dep.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                  {dep.trigger}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono text-slate-800">{dep.commitHash || "N/A"}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{dep.commitMessage || "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(dep.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => setSelectedLogId(dep.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="View Logs"
                  >
                    <Terminal size={18} />
                  </button>
                </td>
              </tr>
            ))}
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
