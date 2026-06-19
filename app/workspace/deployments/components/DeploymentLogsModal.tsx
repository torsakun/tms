"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";

export default function DeploymentLogsModal({
  deploymentId,
  onClose,
}: {
  deploymentId: string;
  onClose: () => void;
}) {
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchDeployment = async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}`);
      if (res.ok) {
        const data = await res.json();
        setDeployment(data.deployment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployment();

    // Poll for updates if still building
    const interval = setInterval(() => {
      if (
        !deployment ||
        deployment.status === "BUILDING" ||
        deployment.status === "PENDING"
      ) {
        fetchDeployment();
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [deploymentId, deployment?.status]);

  useEffect(() => {
    // Auto scroll to bottom of logs
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deployment?.logs]);

  if (!deployment && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-slate-950 w-full max-w-4xl rounded-2xl shadow-premium overflow-hidden flex flex-col h-[80vh] border border-slate-800/80 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/80 bg-slate-900">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-mono font-semibold text-slate-200">
              Terminal Output
            </h2>
            {deployment?.status === "BUILDING" && (
              <Loader2 className="animate-spin text-blue-400" size={16} />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs sm:text-sm text-emerald-400 bg-black leading-relaxed">
          {loading && !deployment ? (
            <div className="text-text-muted flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Loading
              connection...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono">
              {deployment.logs || "Waiting for output..."}
            </pre>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
