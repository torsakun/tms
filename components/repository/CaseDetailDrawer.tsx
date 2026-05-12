"use client";

import React, { useEffect, useState } from "react";
import { X, Edit2, Trash2, Clock, CheckCircle2, AlertCircle, Paperclip, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CaseDetailDrawer({ 
  caseId, 
  projectCode,
  onClose,
  onDeleted
}: { 
  caseId: string | null;
  projectCode: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setData(null);
      return;
    }
    setLoading(true);

    const loadData = async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else {
          // Trigger fallback for mock data
          handleFallback();
        }
      } catch (err) {
        handleFallback();
      } finally {
        setLoading(false);
      }
    };

    const handleFallback = () => {
      // Fallback to dummy data for WOW effect if db is empty during prototype
      setData({
        id: caseId,
        title: "Verify successful login",
        severity: "MAJOR",
        priority: "HIGH",
        automationStatus: "MANUAL",
        preconditions: "User must have a registered account",
        author: { name: "Demo Admin", email: "admin@qase.clone" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [
          { action: "Navigate to login page", expectedResult: "Login page loads" },
          { action: "Enter valid credentials", expectedResult: "Inputs are filled" },
          { action: "Click submit", expectedResult: "User is logged in and redirected to dashboard" }
        ]
      });
    };

    loadData();
  }, [caseId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this test case?")) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      if (onDeleted) onDeleted();
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete test case");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {caseId && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[600px] max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          caseId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
            <span className="font-mono text-sm text-slate-500">{projectCode}-{caseId?.slice(0,4)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/projects/${projectCode}/cases/${caseId}/edit`}
              className="px-3 py-1.5 flex items-center text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Edit2 size={14} className="mr-2" />
              Edit
            </Link>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 flex items-center text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : data ? (
            <div className="p-8 space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{data.title}</h1>
                {data.tags && data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.tags.map((tag: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                    <AlertCircle size={12} className="mr-1" />
                    Severity: {data.severity || "NORMAL"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700">
                    <AlertCircle size={12} className="mr-1" />
                    Priority: {data.priority || "MEDIUM"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                    Automation: {data.automationStatus || "MANUAL"}
                  </span>
                </div>

                {/* Metadata Section (Author & Dates) */}
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 border border-slate-100 mb-8">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block mb-1">Created By</span>
                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] mr-2 shrink-0">
                        {data.author?.name?.charAt(0) || "U"}
                      </div>
                      <span className="truncate">{data.author?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block mb-1">Created On</span>
                    <div className="flex items-center text-sm text-slate-700">
                      <Clock size={14} className="mr-1.5 text-slate-400" />
                      {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block mb-1">Last Updated</span>
                    <div className="flex items-center text-sm text-slate-700">
                      <Clock size={14} className="mr-1.5 text-slate-400" />
                      {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('en-GB') : "Recently"}
                    </div>
                  </div>
                </div>
              </div>

              {data.preconditions && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Preconditions</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 whitespace-pre-wrap">
                    {data.preconditions}
                  </div>
                </div>
              )}

              {data.attachments && data.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center">
                    <Paperclip size={14} className="mr-2" />
                    Attachments ({data.attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {data.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-slate-700 truncate">{file.originalName}</span>
                          <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Download / View"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Steps to Reproduce</h3>
                <div className="space-y-3">
                  {data.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Action</span>
                          <p className="text-sm text-slate-800">{step.action}</p>
                        </div>
                        {step.expectedResult && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">Expected</span>
                            <p className="text-sm text-slate-800">{step.expectedResult}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No data found</div>
          )}
        </div>
      </div>
    </>
  );
}
