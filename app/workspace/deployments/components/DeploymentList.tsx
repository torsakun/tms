"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import DeploymentLogsModal from "./DeploymentLogsModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Check,
  RefreshCw,
  Rocket,
  Terminal,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  HelpCircle,
  ChevronDown,
  LucideIcon,
} from "lucide-react";

export default function DeploymentList({ initialDeployments }: { initialDeployments: any[] }) {
  const [deployments, setDeployments] = useState(initialDeployments);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  
  const [version, setVersion] = useState("v1.0.0");
  const [environment, setEnvironment] = useState("Production");
  const [name, setName] = useState("");

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
    const active = deployments.some((d) => d.status === "PENDING" || d.status === "BUILDING");
    if (active) {
      const interval = setInterval(fetchDeployments, 3000);
      return () => clearInterval(interval);
    }
  }, [deployments]);

  const triggerDeployment = async () => {
    if (!version.trim() || !environment.trim()) {
      toast.error("Version and Environment are required");
      return;
    }
    
    setIsTriggering(true);
    try {
      const res = await fetch("/api/deployments/trigger", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, environment, name })
      });
      if (res.ok) {
        setIsModalOpen(false);
        await fetchDeployments();
        router.refresh();
        toast.success("Deployment triggered");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to trigger deployment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to trigger deployment");
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusStyle = (status: string): { status: string; bg: string; color: string; icon: LucideIcon } => {
    switch (status) {
      case "SUCCESS": return { status: 'Success', bg: 'var(--pass-soft)', color: 'var(--pass)', icon: CheckCircle2 };
      case "FAILED": return { status: 'Failed', bg: 'var(--fail-soft)', color: 'var(--fail)', icon: XCircle };
      case "BUILDING":
      case "PENDING":
        return { status: 'In progress', bg: 'var(--primary-soft)', color: 'var(--primary-text)', icon: RefreshCcw };
      default:
        return { status: status || 'Unknown', bg: 'var(--surface-2)', color: 'var(--text-muted)', icon: HelpCircle };
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="w-full max-w-[980px] mx-auto antialiased font-sans">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.015em] text-text-main">Deployments</div>
          <div className="text-[13px] text-text-muted mt-[2px]">Markers that correlate releases with test results</div>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm">
          <Plus size={16} />
          Add deployment
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1.4fr_120px_130px_100px_40px] gap-[12px] p-[10px_18px] text-[10px] font-semibold tracking-[0.05em] uppercase text-text-faint border-b border-border bg-surface-hover/30">
          <div>Version</div>
          <div>Environment</div>
          <div>Date</div>
          <div>Status</div>
          <div></div>
        </div>
        
        {deployments.map((d) => {
          const st = getStatusStyle(d.status);
          const StatusIcon = st.icon;
          return (
            <div key={d.id} className="grid grid-cols-[1.4fr_120px_130px_100px_40px] gap-[12px] p-[12px_18px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-[11px] min-w-0">
                <div className="w-[30px] h-[30px] rounded-[8px] bg-surface-2 flex items-center justify-center shrink-0">
                  <Rocket size={16} className="text-text-muted" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold font-mono text-text-main truncate">{d.trigger || "Custom"}</div>
                  <div className="text-[11px] text-text-faint truncate">{d.commitMessage || d.commitHash || "-"}</div>
                </div>
              </div>
              <div className="text-[12px] text-text-muted">Production</div> {/* Hardcoded for UI mapping, update backend later */}
              <div className="text-[12px] text-text-muted">{formatDate(d.createdAt)}</div>
              <div>
                <span className="inline-flex items-center gap-[5px] text-[10.5px] font-bold p-[2px_9px] rounded-full" style={{ background: st.bg, color: st.color }}>
                  <StatusIcon size={12} className={d.status === "BUILDING" || d.status === "PENDING" ? "animate-spin" : ""} />
                  {st.status}
                </span>
              </div>
              <div className="flex justify-center text-text-faint">
                <button
                  onClick={() => setSelectedLogId(d.id)}
                  className="hover:text-text-main p-1 flex items-center"
                  title="View Logs"
                >
                  <Terminal size={18} />
                </button>
              </div>
            </div>
          );
        })}
        
        {deployments.length === 0 && (
          <div className="p-8 text-center text-text-muted text-[13px]">No deployments found.</div>
        )}
      </div>

      {/* add modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[64px]" style={{ background: "color(display-p3 0 0 0 / 0.4)" }} onClick={() => setIsModalOpen(false)}>
          <div 
            className="w-[410px] bg-surface border border-border rounded-[15px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-[10px] p-[18px_20px_0]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-soft text-primary-text flex items-center justify-center">
                <Rocket size={19} />
              </div>
              <div className="text-[15.5px] font-semibold text-text-main">Add deployment</div>
            </div>
            
            <div className="p-[16px_20px] flex flex-col gap-[14px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="block text-[12px] text-text-muted mb-[6px]">Version</label>
                  <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_2px_var(--ring)] text-[13px] font-mono focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                    <input 
                      type="text" 
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="v4.9.0"
                      className="w-full bg-transparent outline-none text-text-main"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-text-muted mb-[6px]">Environment</label>
                  <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="w-full bg-transparent outline-none text-text-main appearance-none"
                    >
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                      <option value="Development">Development</option>
                    </select>
                    <ChevronDown size={17} className="text-text-faint shrink-0 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-text-muted mb-[6px]">Name / note</label>
                <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Checkout redesign RC"
                    className="w-full bg-transparent outline-none text-text-main"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-[9px] p-[14px_20px] border-t border-border bg-surface">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={triggerDeployment} disabled={isTriggering} variant="primary" size="sm">
                {isTriggering ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedLogId && (
        <DeploymentLogsModal
          deploymentId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </div>
  );
}
