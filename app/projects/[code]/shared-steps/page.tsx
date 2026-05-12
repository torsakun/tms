"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Settings, Trash2, Share2 } from "lucide-react";

export default function SharedStepsPage() {
  const params = useParams();
  const projectCode = params.code as string;
  const [sharedSteps, setSharedSteps] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${projectCode}/shared-steps`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSharedSteps(data);
      })
      .catch(console.error);
  }, [projectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectCode}/shared-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, action, expectedResult })
      });
      if (res.ok) {
        const newStep = await res.json();
        setSharedSteps([newStep, ...sharedSteps]);
        setIsModalOpen(false);
        setTitle("");
        setAction("");
        setExpectedResult("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden transition-colors">
      <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center space-x-3">
          <Share2 className="text-text-muted" size={24} />
          <h1 className="text-2xl font-bold text-text-main">Shared Steps</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Create shared step
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {sharedSteps.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-lg border border-border border-dashed">
            <Share2 size={48} className="mx-auto text-text-muted opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-text-main mb-2">No shared steps yet</h3>
            <p className="text-text-muted max-w-sm mx-auto mb-6 text-sm">
              Create reusable steps like "Login as Admin" to include in multiple test cases, saving you time when steps change.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm"
            >
              Create shared step
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 border-b border-border text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Expected Result</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sharedSteps.map(step => (
                  <tr key={step.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-text-main">{step.title}</td>
                    <td className="px-6 py-4 text-text-muted">{step.action}</td>
                    <td className="px-6 py-4 text-text-muted">{step.expectedResult || "-"}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-1.5 text-text-muted hover:text-text-main transition-colors"><Settings size={16} /></button>
                      <button className="p-1.5 text-text-muted hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[600px] rounded-lg shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold text-text-main">Create shared step</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border text-text-main rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    placeholder="e.g. Login as Administrator"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-1">Action <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full bg-background border border-border text-text-main rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      placeholder="1. Enter email..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-1">Expected Result</label>
                    <textarea 
                      value={expectedResult}
                      onChange={(e) => setExpectedResult(e.target.value)}
                      className="w-full bg-background border border-border text-text-main rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      placeholder="User is logged in..."
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-background border-t border-border flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover text-text-main transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white text-sm font-medium shadow-[0_0_10px_rgba(93,135,255,0.4)] transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
