"use client";

import React, { useState, useEffect, use } from "react";
import { 
  Bot, 
  Sparkles, 
  Code2, 
  PlayCircle, 
  Activity, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Terminal,
  RefreshCw,
  GitPullRequest,
  Eye,
  Save,
  X,
  Trash2,
  DollarSign,
  Clock
} from "lucide-react";

export default function TESSAAutomationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'READY_TO_PUSH' | 'PUSHING' | 'DONE'>('IDLE');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // Review Modal State
  const [reviewCase, setReviewCase] = useState<any | null>(null);
  const [reviewScript, setReviewScript] = useState<string>("");
  const [isSavingScript, setIsSavingScript] = useState(false);
  
  // Pipeline Orchestration State
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [newPipelineTitle, setNewPipelineTitle] = useState("");
  const [scheduleType, setScheduleType] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('00:00');
  const [scheduleDay, setScheduleDay] = useState('1'); 
  const [customCron, setCustomCron] = useState('0 0 * * *');
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  const [stats, setStats] = useState({ total: 0, automated: 0, manual: 0 });

  useEffect(() => {
    fetchData();
  }, [code]);

  const fetchData = () => {
    fetch(`/api/projects/${code}/cases`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const manualCases = data.filter(c => c.automationStatus === 'MANUAL');
          const toBeAutomatedCases = data.filter(c => c.automationStatus === 'TO_BE_AUTOMATED');
          const automatedCases = data.filter(c => c.automationStatus === 'AUTOMATED' || (c.automationStatus !== 'MANUAL' && c.automationStatus !== 'TO_BE_AUTOMATED' && c.automationScript));
          
          setStats({
            total: data.length,
            automated: automatedCases.length,
            manual: manualCases.length
          });
          
          const combined = [...toBeAutomatedCases, ...manualCases];
          setCases(combined);
          // Only auto-select manual ones
          setSelectedCaseIds(manualCases.map(c => c.id));
        }
      });

    fetch(`/api/projects/${code}/pipelines`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPipelines(data);
        }
      });

    fetch(`/api/projects/${code}/ai/analytics`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAnalytics(data);
      });
  };

  const toggleSelection = (id: string) => {
    setSelectedCaseIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedCaseIds.length === 0) return;
    setStatus('GENERATING');
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds: selectedCaseIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStatus('IDLE');
      fetchData(); // Refresh to show as TO_BE_AUTOMATED
    } catch (err: any) {
      setError(err.message);
      setStatus('IDLE');
    }
  };

  const handlePushToGithub = async () => {
    const pendingCases = cases.filter(c => c.automationStatus === 'TO_BE_AUTOMATED').map(c => c.id);
    if (pendingCases.length === 0) return;
    
    setStatus('PUSHING');
    setError("");

    try {
      const res = await fetch(`/api/projects/${code}/ai/batch-github-pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds: pendingCases })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPrUrl(data.prUrl);
      setStatus('DONE');
      
      fetchData(); // Refresh to remove AUTOMATED ones
    } catch (err: any) {
      setError(err.message);
      setStatus('IDLE');
    }
  };

  const handleOpenReview = async (tc: any) => {
    setReviewCase(tc);
    setReviewScript("Loading script...");
    try {
      const res = await fetch(`/api/projects/${code}/cases/${tc.id}`);
      const data = await res.json();
      if (data && data.automationScript) {
        setReviewScript(data.automationScript);
      } else {
        setReviewScript("// No script found.");
      }
    } catch (err) {
      setReviewScript("// Error loading script.");
    }
  };

  const handleSaveReview = async () => {
    if (!reviewCase) return;
    setIsSavingScript(true);
    try {
      await fetch(`/api/projects/${code}/cases/${reviewCase.id}/script`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: reviewScript })
      });
      setReviewCase(null);
    } catch (err) {
      alert("Failed to save script");
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await fetch(`/api/projects/${code}/cases/${id}/discard`, { method: "POST" });
      fetchData();
    } catch (err) {
      alert("Failed to discard");
    }
  };

  const generateCron = () => {
    if (scheduleType === 'custom') return customCron;
    const [hours, minutes] = scheduleTime.split(':');
    const h = parseInt(hours || '0', 10);
    const m = parseInt(minutes || '0', 10);
    
    if (scheduleType === 'daily') {
      return `${m} ${h} * * *`;
    } else if (scheduleType === 'weekly') {
      return `${m} ${h} * * ${scheduleDay}`;
    } else if (scheduleType === 'monthly') {
      return `${m} ${h} ${scheduleDay} * *`;
    }
    return '0 0 * * *';
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineTitle) return;
    setIsCreatingPipeline(true);
    try {
      const computedCron = generateCron();
      const res = await fetch(`/api/projects/${code}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPipelineTitle, cron: computedCron })
      });
      if (res.ok) {
        setIsPipelineModalOpen(false);
        setNewPipelineTitle("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  const handleTogglePipeline = async (id: string, isActive: boolean) => {
    // Optimistic UI update
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, isActive } : p));
    try {
      await fetch(`/api/projects/${code}/pipelines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
    } catch (err) {
      console.error(err);
      fetchData(); // revert on failure
    }
  };

  const handleTriggerPipeline = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${code}/pipelines/${id}/trigger`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Pipeline triggered! A new Test Run has been created.");
      } else {
        const err = await res.json();
        alert("Trigger failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pipeline schedule?")) return;
    try {
      setPipelines(prev => prev.filter(p => p.id !== id));
      await fetch(`/api/projects/${code}/pipelines/${id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const manualCasesCount = cases.filter(c => c.automationStatus === 'MANUAL').length;
  const pendingCasesCount = cases.filter(c => c.automationStatus === 'TO_BE_AUTOMATED').length;
  const showPushBtn = pendingCasesCount > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0B0F19] overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-3 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles size={14} className="mr-2 text-indigo-400" />
              Powered by Generative AI
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center tracking-tight">
              TESSA <span className="mx-3 text-slate-300 dark:text-slate-700 font-light">|</span> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">Test Orchestration</span>
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Your autonomous AI assistant for writing scripts, healing flaky tests, and managing pipelines.
            </p>
          </div>
          <button 
            onClick={() => setIsPipelineModalOpen(true)}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all hover:-translate-y-0.5"
          >
            <Zap size={18} className="mr-2" /> Create Scheduled Pipeline
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">AI Generated Scripts</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.automated}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                <Code2 size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium relative z-10">
              <Activity size={14} className="mr-1" /> System total automated cases
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Executive ROI</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${analytics?.roi?.estimatedValueUsd || "0"}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-medium relative z-10">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                 <Clock size={14} className="mr-1" /> {analytics?.roi?.totalHoursSaved || 0} hrs saved
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                 ≈ ฿{analytics?.roi?.estimatedValueThb || "0"}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Automation Coverage</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.total > 0 ? Math.round((stats.automated / stats.total) * 100) : 0}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                <Bot size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium relative z-10">
              <AlertTriangle size={14} className="mr-1" /> {stats.manual} manual cases recommended for automation
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center">
            <AlertTriangle size={18} className="mr-2 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {status === 'DONE' && prUrl && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 size={24} className="mr-3 shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Successfully pushed to GitHub!</h3>
                <p className="text-sm mt-1 opacity-90">TESSA generated the scripts and opened a Pull Request for your review.</p>
              </div>
            </div>
            <a 
              href={prUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors flex items-center shadow-lg shadow-emerald-500/20"
            >
              <GitPullRequest size={18} className="mr-2" /> View Pull Request
            </a>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Batch Generator Panel */}
          <div className="bg-white dark:bg-[#111623] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm h-[500px]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <Bot size={18} className="mr-2 text-indigo-500" /> Suggested for Automation
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">{selectedCaseIds.length} Selected</span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedCaseIds.length === manualCasesCount && manualCasesCount > 0} 
                          onChange={() => selectedCaseIds.length === manualCasesCount ? setSelectedCaseIds([]) : setSelectedCaseIds(cases.filter(c => c.automationStatus === 'MANUAL').map(c => c.id))}
                          disabled={status !== 'IDLE' || manualCasesCount === 0}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" 
                        />
                      </th>
                      <th className="px-6 py-3">Test Case</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#111623]">
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                          No manual test cases found. Create some cases in the Repository first!
                        </td>
                      </tr>
                    ) : cases.map((tc) => {
                      const isSelected = selectedCaseIds.includes(tc.id);
                      const isManual = tc.automationStatus === 'MANUAL';
                      const isPending = tc.automationStatus === 'TO_BE_AUTOMATED';
                      return (
                        <tr key={tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4">
                            {isManual ? (
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => toggleSelection(tc.id)}
                                disabled={status !== 'IDLE'}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                              />
                            ) : (
                              <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]"><CheckCircle2 size={10} className="text-white" /></div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white truncate max-w-[250px]">
                            {tc.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isManual ? (
                                status === 'GENERATING' && isSelected ? <span className="flex items-center text-indigo-500 text-xs"><RefreshCw size={12} className="mr-1 animate-spin" /> Generating...</span> :
                                <span className="text-slate-400 text-xs">Ready</span>
                            ) : isPending ? (
                               <div className="flex items-center space-x-2">
                                 <span className="flex items-center text-emerald-500 text-xs"><CheckCircle2 size={12} className="mr-1" /> Pending PR</span>
                                 <button onClick={() => handleOpenReview(tc)} className="text-slate-400 hover:text-indigo-500 transition-colors bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/20 p-1 rounded" title="View/Edit Code">
                                   <Eye size={14} />
                                 </button>
                                 <button onClick={() => handleDiscard(tc.id)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/20 p-1 rounded" title="Discard">
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                {!showPushBtn ? (
                  <button 
                    onClick={handleGenerate}
                    disabled={status !== 'IDLE' || selectedCaseIds.length === 0}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
                  >
                    {status === 'GENERATING' ? (
                      <><RefreshCw size={18} className="mr-2 animate-spin" /> Batch Generating ({selectedCaseIds.length})...</>
                    ) : (
                      <><Sparkles size={18} className="mr-2" /> Ask TESSA to Generate Scripts</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={handlePushToGithub}
                    disabled={status === 'PUSHING' || status === 'GENERATING'}
                    className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(35,134,54,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
                  >
                    {status === 'PUSHING' ? (
                      <><RefreshCw size={18} className="mr-2 animate-spin" /> Creating Pull Request...</>
                    ) : (
                      <><GitPullRequest size={18} className="mr-2" /> Push {pendingCasesCount} Scripts to GitHub PR</>
                    )}
                  </button>
                )}
                <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center">
                  <Activity size={12} className="mr-1" /> TESSA estimates this will save {(selectedCaseIds.length || pendingCasesCount) * 45} minutes of manual work
                </p>
              </div>
            </div>
          </div>

          {/* Healing Logs & Pipeline */}
          <div className="space-y-8 flex flex-col">
            
            {/* Flakiness Radar */}
            <div className="bg-white dark:bg-[#111623] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <Activity size={18} className="mr-2 text-rose-500" /> Flakiness Radar
                </h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full font-medium">Top {analytics?.flakiness?.length || 0}</span>
              </div>
              <div className="p-0">
                {(!analytics?.flakiness || analytics.flakiness.length === 0) ? (
                   <div className="p-6 text-center text-slate-500 text-sm">
                     No flaky tests detected yet. Everything is stable!
                   </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {analytics.flakiness.map((item: any) => (
                      <div key={item.caseId} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between group">
                        <div className="flex-1 min-w-0 mr-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{item.title}</h4>
                          <div className="flex items-center mt-1.5 space-x-1">
                             {item.recentStatuses.map((s: string, i: number) => (
                               <div key={i} className={`w-2 h-2 rounded-full ${s === 'PASSED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} title={s}></div>
                             ))}
                             <span className="text-[10px] text-slate-400 ml-2 font-medium">Score: {item.flakinessScore}%</span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded text-xs font-bold flex items-center shadow-sm">
                          <Sparkles size={12} className="mr-1" /> Auto-Heal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="bg-white dark:bg-[#111623] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <PlayCircle size={18} className="mr-2 text-blue-500" /> Pipeline Orchestration
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {pipelines.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No scheduled pipelines yet. Create one above!
                  </div>
                ) : pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#24292F] flex items-center justify-center mr-4 shadow-sm shrink-0">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{pipeline.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Schedule: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">{pipeline.cron}</code></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => handleTriggerPipeline(pipeline.id)}
                        className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center"
                      >
                        <PlayCircle size={14} className="mr-1" /> Run Now
                      </button>
                      
                      <label className="flex items-center cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={pipeline.isActive} 
                            onChange={(e) => handleTogglePipeline(pipeline.id, e.target.checked)} 
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${pipeline.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                          <div className={`absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform transform ${pipeline.isActive ? 'translate-x-4' : ''} shadow-sm`}></div>
                        </div>
                        <div className="ml-2 text-xs font-bold w-12 text-center">
                           {pipeline.isActive ? (
                             <span className="text-emerald-500">Active</span>
                           ) : (
                             <span className="text-slate-400">Standby</span>
                           )}
                        </div>
                      </label>
                      <button 
                        onClick={() => handleDeletePipeline(pipeline.id)}
                        className="text-xs font-bold px-2 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center"
                        title="Delete Schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Review Script Modal */}
      {reviewCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <Code2 size={18} className="mr-2 text-indigo-500" /> Review Generated Script
              </h3>
              <button onClick={() => setReviewCase(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Test Case:</span> {reviewCase.title}
            </div>

            <div className="flex-1 overflow-hidden relative">
              <textarea 
                className="w-full h-full p-6 bg-[#0d1117] text-emerald-400 font-mono text-sm resize-none focus:outline-none"
                value={reviewScript}
                onChange={(e) => setReviewScript(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end space-x-3">
              <button 
                onClick={() => setReviewCase(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview}
                disabled={isSavingScript}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center transition-colors disabled:opacity-50"
              >
                {isSavingScript ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                {isSavingScript ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Pipeline Modal */}
      {isPipelineModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111623] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <PlayCircle size={18} className="mr-2 text-indigo-500" /> Create Scheduled Pipeline
              </h3>
              <button onClick={() => setIsPipelineModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pipeline Title</label>
                <input 
                  type="text" 
                  value={newPipelineTitle}
                  onChange={(e) => setNewPipelineTitle(e.target.value)}
                  placeholder="e.g. Nightly Regression"
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule Frequency</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom (Cron)</option>
                </select>

                {scheduleType !== 'custom' && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Time (UTC)</label>
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    {scheduleType === 'weekly' && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Day of Week</label>
                        <select
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(e.target.value)}
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                          <option value="0">Sunday</option>
                        </select>
                      </div>
                    )}
                    {scheduleType === 'monthly' && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Day of Month</label>
                        <input 
                          type="number" 
                          min="1" max="31"
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(e.target.value)}
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {scheduleType === 'custom' && (
                  <div>
                    <input 
                      type="text" 
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      placeholder="0 0 * * *"
                      className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">Example: <code>0 0 * * *</code> (Runs every midnight UTC).</p>
                  </div>
                )}
                
                {scheduleType !== 'custom' && (
                  <p className="text-xs text-slate-500 mt-3 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">Generated Cron: {generateCron()}</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3">
              <button 
                onClick={() => setIsPipelineModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePipeline}
                disabled={isCreatingPipeline || !newPipelineTitle || (scheduleType === 'custom' && !customCron)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center transition-colors disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                {isCreatingPipeline ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                {isCreatingPipeline ? "Creating..." : "Save Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
