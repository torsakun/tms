"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Search,
  Check,
  Minus,
  BadgeCheck,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Suite {
  id: string;
  title: string;
  parentId?: string | null;
  children?: Suite[];
}

interface TestCaseDTO {
  id: string;
  code?: string;
  title: string;
  status?: string;
  suiteId?: string | null;
}

interface OptionDTO {
  id: string;
  title: string;
}

interface PlanDTO {
  title: string;
  testCases?: TestCaseDTO[];
}

interface RunDTO {
  id: string;
}

interface ErrorDTO {
  error?: string;
}

function CreateRunContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const planId = searchParams.get("plan");
  const requestedCaseIds = useMemo(
    () =>
      (searchParams.get("cases") || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [searchParams],
  );

  const [title, setTitle] = useState(`Run: ${new Date().toLocaleDateString()}`);
  const [description, setDescription] = useState("");
  const [cases, setCases] = useState<TestCaseDTO[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [environments, setEnvironments] = useState<OptionDTO[]>([]);
  const [milestones, setMilestones] = useState<OptionDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const [casesRes, suitesRes, envsRes, msRes] = await Promise.all([
          fetch(`/api/projects/${code}/cases`),
          fetch(`/api/projects/${code}/suites`),
          fetch(`/api/projects/${code}/environments`),
          fetch(`/api/projects/${code}/milestones`),
        ]);

        if (casesRes.ok && suitesRes.ok) {
          const casesData = (await casesRes.json()) as TestCaseDTO[];
          const suitesData = (await suitesRes.json()) as Suite[];

          if (envsRes.ok) {
            const envsData = await envsRes.json();
            if (Array.isArray(envsData)) setEnvironments(envsData as OptionDTO[]);
          }
          if (msRes.ok) {
            const msData = await msRes.json();
            if (Array.isArray(msData)) setMilestones(msData as OptionDTO[]);
          }

          setCases(casesData);
          setSuites(suitesData);

          // By default expand all
          const allSuiteIds = new Set<string>(suitesData.map((s: Suite) => s.id));
          setExpandedSuites(allSuiteIds);

          if (requestedCaseIds.length > 0) {
            const validRequestedIds = new Set(
              casesData
                .filter((c: TestCaseDTO) => requestedCaseIds.includes(c.id))
                .map((c: TestCaseDTO) => c.id),
            );
            setSelectedIds(validRequestedIds);
          } else if (planId) {
            try {
              const planRes = await fetch(`/api/projects/${code}/plans/${planId}`);
              if (planRes.ok) {
                const planData = (await planRes.json()) as PlanDTO;
                setTitle(`Run: ${planData.title}`);
                setSelectedIds(
                  new Set(
                    (planData.testCases || []).map((c) => c.id),
                  ),
                );
              } else {
                setSelectedIds(new Set(casesData.map((c: TestCaseDTO) => c.id)));
              }
            } catch {
              setSelectedIds(new Set(casesData.map((c: TestCaseDTO) => c.id)));
            }
          } else {
            setSelectedIds(new Set(casesData.map((c: TestCaseDTO) => c.id)));
          }
        }
      } catch {
        setCases([]);
        setSuites([]);
        setSelectedIds(new Set());
      }
    };
    fetchCases();
  }, [code, planId, requestedCaseIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("Please select at least one test case.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          caseIds: Array.from(selectedIds),
          planId: planId || undefined,
          environmentId: selectedEnvId || undefined,
          milestoneId: selectedMilestoneId || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ErrorDTO;
        throw new Error(data.error || "Failed to create run");
      }

      const data = (await res.json()) as RunDTO;
      router.push(`/projects/${code}/runs/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create run");
      setLoading(false);
    }
  };

  // Build hierarchical tree mixed with cases
  const treeNodes = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    const q = searchQuery.toLowerCase().trim();

    // Group cases by suite
    const casesBySuite = new Map<string | null, TestCaseDTO[]>();
    cases.forEach((c) => {
      const match = !q || c.title.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q));
      if (match) {
        const sId = c.suiteId || null;
        if (!casesBySuite.has(sId)) casesBySuite.set(sId, []);
        casesBySuite.get(sId)!.push(c);
      }
    });

    // Root-level suites
    const rootSuites = suites.filter((s) => !s.parentId);

    const getSuiteState = (suiteId: string): "on" | "off" | "mixed" => {
      const suiteCases = casesBySuite.get(suiteId) || [];
      const selectedCount = suiteCases.filter((c) => selectedIds.has(c.id)).length;
      if (suiteCases.length === 0) return "off";
      if (selectedCount === suiteCases.length) return "on";
      if (selectedCount === 0) return "off";
      return "mixed";
    };

    const toggleSuite = (suiteId: string, currentState: "on" | "off" | "mixed") => {
      const suiteCases = casesBySuite.get(suiteId) || [];
      const newSelected = new Set(selectedIds);
      suiteCases.forEach((c) => {
        if (currentState === "on") newSelected.delete(c.id);
        else newSelected.add(c.id);
      });
      setSelectedIds(newSelected);
    };

    const toggleCase = (caseId: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(caseId)) newSelected.delete(caseId);
      else newSelected.add(caseId);
      setSelectedIds(newSelected);
    };

    const renderSuite = (suite: Suite, level: number) => {
      const suiteCases = casesBySuite.get(suite.id) || [];
      const childSuites = suites.filter((s) => s.parentId === suite.id);
      
      // Hide empty suites if searching
      if (q && suiteCases.length === 0 && childSuites.length === 0) return;

      const isExpanded = expandedSuites.has(suite.id);
      const state = getSuiteState(suite.id);
      
      const checked = state === "on" || state === "mixed";

      nodes.push(
        <div key={`suite-${suite.id}`} className="flex items-center gap-[9px] py-[9px] pr-[18px] bg-transparent hover:bg-surface-hover transition-colors cursor-pointer select-none" style={{ paddingLeft: `${18 + level * 20}px` }} onClick={() => {
            const next = new Set(expandedSuites);
            if (isExpanded) next.delete(suite.id);
            else next.add(suite.id);
            setExpandedSuites(next);
        }}>
          <div
            className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0"
            style={checked
              ? { background: "var(--primary)" }
              : { background: "var(--bg-surface)", boxShadow: "inset 0 0 0 1.5px var(--border-strong)" }}
            onClick={(e) => { e.stopPropagation(); toggleSuite(suite.id, state); }}
          >
            {state === "on" && <Check size={13} className="text-[var(--primary-fg)]" strokeWidth={3} />}
            {state === "mixed" && <Minus size={13} className="text-[var(--primary-fg)]" strokeWidth={3} />}
          </div>
          {isExpanded
            ? <ChevronDown size={17} className="text-text-faint shrink-0" />
            : <ChevronRight size={17} className="text-text-faint shrink-0" />}
          {isExpanded
            ? <FolderOpen size={16} className="text-text-faint shrink-0" />
            : <Folder size={16} className="text-text-faint shrink-0" />}
          <span className="flex-1 text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-text-main">{suite.title}</span>
          <span className="text-[11px] text-text-faint tabular-nums">{suiteCases.length}</span>
        </div>
      );

      if (isExpanded) {
        childSuites.forEach((cs) => renderSuite(cs, level + 1));
        suiteCases.forEach((c) => {
          const on = selectedIds.has(c.id);
          nodes.push(
            <div key={`case-${c.id}`} className="flex items-center gap-[9px] py-[9px] pr-[18px] transition-colors cursor-pointer select-none hover:bg-surface-hover" style={{ paddingLeft: `${18 + (level + 1) * 20 + 26}px`, background: on ? "var(--primary-light)" : "transparent" }} onClick={() => toggleCase(c.id)}>
              <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0" style={on ? { background: "var(--primary)" } : { background: "var(--bg-surface)", boxShadow: "inset 0 0 0 1.5px var(--border-strong)" }}>
                {on && <Check size={13} className="text-[var(--primary-fg)]" strokeWidth={3} />}
              </div>
              <FileText size={16} className="text-text-faint shrink-0" />
              <span className="flex-1 text-[13px] font-normal whitespace-nowrap overflow-hidden text-ellipsis text-text-main">{c.title}</span>
            </div>
          );
        });
      }
    };

    // Unassigned cases first
    const unassigned = casesBySuite.get(null) || [];
    unassigned.forEach((c) => {
      const on = selectedIds.has(c.id);
      nodes.push(
        <div key={`case-${c.id}`} className="flex items-center gap-[9px] py-[9px] pr-[18px] pl-[18px] transition-colors cursor-pointer select-none hover:bg-surface-hover" style={{ background: on ? "var(--primary-light)" : "transparent" }} onClick={() => toggleCase(c.id)}>
          <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0" style={on ? { background: "var(--primary)" } : { background: "var(--bg-surface)", boxShadow: "inset 0 0 0 1.5px var(--border-strong)" }}>
            {on && <Check size={13} className="text-[var(--primary-fg)]" strokeWidth={3} />}
          </div>
          <FileText size={16} className="text-text-faint shrink-0" />
          <span className="flex-1 text-[13px] font-normal whitespace-nowrap overflow-hidden text-ellipsis text-text-main">{c.title}</span>
        </div>
      );
    });

    rootSuites.forEach((s) => renderSuite(s, 0));

    return nodes;
  }, [cases, suites, searchQuery, selectedIds, expandedSuites]);

  return (
    <div className="w-full flex flex-col min-h-0 h-full bg-background antialiased text-[14px]">
      <div className="flex items-center gap-[12px] p-[14px_22px] bg-surface border-b border-border shrink-0">
        <Link href={`/projects/${code}/runs`} className="text-[13px] text-text-faint hover:text-text-main transition-colors">Test Runs</Link>
        <ChevronRight size={16} className="text-text-faint" />
        <span className="text-[14px] font-semibold text-text-main">New test run</span>
      </div>

      <div className="grid grid-cols-[340px_1fr] flex-1 min-h-0">
        {/* Left: run fields */}
        <div className="border-r border-border bg-surface p-[20px_18px] flex flex-col gap-[16px] overflow-auto">
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-text-faint">Run details</div>
          
          {error && (
            <div className="text-[13px] text-danger bg-danger-soft p-3 rounded-[10px]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[12.5px] text-text-muted mb-[6px]">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full h-[40px] px-[13px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border)] focus:shadow-[inset_0_0_0_2px_var(--primary)] text-[13.5px] outline-none transition-shadow text-text-main" 
            />
          </div>
          
          <div>
            <label className="block text-[12.5px] text-text-muted mb-[6px]">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full min-h-[54px] p-[10px_13px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border)] focus:shadow-[inset_0_0_0_2px_var(--primary)] text-[13px] outline-none transition-shadow text-text-main resize-none" 
            />
          </div>
          
          <div>
            <label className="block text-[12.5px] text-text-muted mb-[6px]">Environment</label>
            <div className="relative">
              <select 
                value={selectedEnvId} 
                onChange={e => setSelectedEnvId(e.target.value)} 
                className="w-full h-[40px] pl-[12px] pr-[30px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border)] focus:shadow-[inset_0_0_0_2px_var(--primary)] text-[13px] outline-none transition-shadow text-text-main appearance-none"
              >
                <option value="">No environment</option>
                {environments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <ChevronDown size={18} className="text-text-faint absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-[12.5px] text-text-muted mb-[6px]">Milestone</label>
            <div className="relative">
              <select 
                value={selectedMilestoneId} 
                onChange={e => setSelectedMilestoneId(e.target.value)} 
                className="w-full h-[40px] pl-[12px] pr-[30px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border)] focus:shadow-[inset_0_0_0_2px_var(--primary)] text-[13px] outline-none transition-shadow text-text-main appearance-none"
              >
                <option value="">No milestone</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <ChevronDown size={18} className="text-text-faint absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {planId && (
            <div>
              <label className="block text-[12.5px] text-text-muted mb-[6px]">From test plan <span className="text-text-faint">· optional</span></label>
              <div className="flex items-center justify-between h-[40px] px-[12px] rounded-[10px] bg-primary-light shadow-[inset_0_0_0_1px_var(--primary)] text-[13px] text-[var(--primary-text)] font-medium">
                <span className="flex items-center gap-[7px]"><BadgeCheck size={17} />Linked Plan</span>
                <Check size={18} />
              </div>
              <div className="text-[11px] text-text-faint mt-[6px]">Cases from the plan are preselected below.</div>
            </div>
          )}
        </div>

        {/* Right: case selection */}
        <div className="flex flex-col min-w-0 bg-background">
          <div className="flex items-center gap-[10px] p-[13px_18px] border-b border-border bg-surface shrink-0">
            <div className="font-semibold text-[14px] text-text-main">Select cases</div>
            <div className="flex-1" />
            <div className="relative flex items-center h-[34px] bg-surface shadow-[inset_0_0_0_1px_var(--border)] rounded-[9px] min-w-[180px]">
              <Search size={17} className="text-text-faint absolute left-[11px]" />
              <input 
                type="text" 
                placeholder="Search cases" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-[34px] pr-[11px] bg-transparent outline-none text-[12.5px] text-text-main placeholder:text-text-faint rounded-[9px] focus:shadow-[inset_0_0_0_2px_var(--primary)] transition-shadow" 
              />
            </div>
            <span className="text-[12px] font-bold p-[5px_11px] rounded-full bg-primary-light text-[var(--primary-text)] shrink-0">{selectedIds.size} selected</span>
          </div>
          
          <div className="flex-1 overflow-auto py-[4px]">
            {treeNodes}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="flex items-center gap-[10px] p-[13px_22px] bg-surface border-t border-border shrink-0">
        <span className="text-[12.5px] text-text-muted"><span className="font-bold text-text-main">{selectedIds.size}</span> cases selected</span>
        <div className="flex-1" />
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="button" variant="primary" loading={loading} onClick={handleSubmit}>
          {!loading && <Play size={16} />}
          {loading ? "Starting..." : "Start run"}
        </Button>
      </div>
    </div>
  );
}

export default function CreateRunPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRunContent />
    </Suspense>
  );
}
