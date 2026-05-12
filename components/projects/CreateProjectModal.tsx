"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, HelpCircle, AlertCircle } from "lucide-react";

export function CreateProjectModal() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState("private");
  const [memberAccess, setMemberAccess] = useState("all");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    router.push("/projects");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, description })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await res.json();
      
      // Reset form
      setName("");
      setCode("");
      setDescription("");
      
      handleClose();
      router.refresh(); // Refresh the list of projects
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate code from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Only auto-generate if code is empty or matches previous auto-generation
    if (!code || code === name.substring(0, code.length).toUpperCase().replace(/[^A-Z0-9]/g, '')) {
      const newCode = newName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
      setCode(newCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Create new project</h2>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
                <AlertCircle size={16} className="mr-2 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Project name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="For example: Web Application"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Project code <span className="text-red-500">*</span>
                </label>
                <HelpCircle size={14} className="ml-1.5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="For example: WA"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Write a few sentences about your project"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Project access type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Project access type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="private"
                        checked={accessType === "private"}
                        onChange={(e) => setAccessType(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">Private</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="public"
                        checked={accessType === "public"}
                        onChange={(e) => setAccessType(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">Public</span>
                  </label>
                </div>
              </div>

              {/* Member access */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Member access
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="memberAccess" 
                        value="all"
                        checked={memberAccess === "all"}
                        onChange={(e) => setMemberAccess(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">Add all members to this project</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="memberAccess" 
                        value="group"
                        checked={memberAccess === "group"}
                        onChange={(e) => setMemberAccess(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">Group access</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="memberAccess" 
                        value="none"
                        checked={memberAccess === "none"}
                        onChange={(e) => setMemberAccess(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full peer-checked:border-blue-600 group-hover:border-blue-400 transition-colors"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">Don't add members</span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 space-x-3">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            form="create-project-form"
            type="submit"
            disabled={loading || !name || !code}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create project"}
          </button>
        </footer>
      </div>
    </div>
  );
}
