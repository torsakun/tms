"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Check, X, Edit2, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldOption {
  id: string;
  value: string;
}

interface CustomField {
  id: string;
  name: string;
  group: string;
  entity: string;
  type: string;
  options: FieldOption[] | null;
  projects: string;
  projectIds?: string[];
  isRequired: boolean;
  isSystem: boolean;
  order: number;
  isGlobal?: boolean;
}

export default function FieldsClient() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [allProjects, setAllProjects] = useState<{id: string, name: string, code: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("SELECT");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [isGlobal, setIsGlobal] = useState(true);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'VALUES'>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workspace/fields");
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (err) {
      console.error("Failed to fetch fields:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingField(null);
    setName("");
    setType("SELECT");
    setIsRequired(false);
    setOptions([{ id: Date.now().toString(), value: "" }]);
    setIsGlobal(true);
    setProjectIds([]);
    setIsDropdownOpen(false);
    setActiveTab('GENERAL');
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setName(field.name);
    setType(field.type);
    setIsRequired(field.isRequired);
    setOptions(field.options || []);
    setIsGlobal(field.isGlobal !== false);
    setProjectIds(field.projectIds || []);
    setIsDropdownOpen(false);
    setActiveTab('GENERAL');
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now().toString(), value: "" }]);
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, value } : opt));
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        type,
        isRequired,
        isGlobal,
        projectIds,
        options: (type === "SELECT" || type === "MULTI_SELECT" || type === "RADIO") ? options.filter(o => o.value.trim() !== "") : null
      };

      const url = editingField ? `/api/workspace/fields/${editingField.id}` : "/api/workspace/fields";
      const method = editingField ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchFields();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save field:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom field?")) return;
    try {
      const res = await fetch(`/api/workspace/fields/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchFields();
      }
    } catch (err) {
      console.error("Failed to delete field:", err);
    }
  };

  const getTypeLabel = (typeStr: string) => {
    switch (typeStr) {
      case 'SELECT': return 'Select list (single)';
      case 'MULTI_SELECT': return 'Select list (multi)';
      case 'TEXT': return 'Paragraph';
      case 'STRING': return 'Short text';
      case 'CHECKBOX': return 'Checkbox';
      case 'NUMBER': return 'Number';
      case 'RADIO': return 'Radio';
      case 'USER_PICKER': return 'User picker';
      case 'URL': return 'URL';
      case 'DATE_PICKER': return 'Date picker';
      default: return typeStr;
    }
  };

  const isListType = type === 'SELECT' || type === 'MULTI_SELECT' || type === 'RADIO';

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">Fields</h1>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={openCreateModal}
          className="bg-primary text-primary-foreground shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors flex items-center"
        >
          <Plus size={16} className="mr-2" /> Create custom field
        </button>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 text-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search for fields" 
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border text-text-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
        <button className="text-primary hover:underline text-sm font-medium">Add filter</button>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-text-muted" size={32} />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Group</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Projects</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Required</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-main uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-text-main font-medium">{field.name}</td>
                  <td className="px-6 py-3">
                    <span className="bg-border/50 text-text-main px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                      {field.group}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-text-main flex items-center">
                      <svg className="w-4 h-4 mr-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {field.entity}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-text-muted flex items-center">
                      {field.type === 'SELECT' && <svg className="w-4 h-4 mr-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {field.type === 'TEXT' && <svg className="w-4 h-4 mr-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
                      {getTypeLabel(field.type)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted">{field.projects}</td>
                  <td className="px-6 py-3">
                    {field.isRequired ? (
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <Check size={16} className="mr-1" /> Yes
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500 text-sm font-medium">
                        <X size={16} className="mr-1" /> No
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted">
                    {/* Add order display */}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openEditModal(field)}
                        className="text-text-muted hover:text-text-main p-1.5 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!field.isSystem && (
                        (!field.isGlobal && field.projectIds && field.projectIds.length === 0) ? (
                          <button 
                            onClick={() => handleDelete(field.id)}
                            className="text-text-muted hover:text-red-500 p-1.5 transition-colors"
                            title="Delete custom field"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="text-slate-300 p-1.5 cursor-not-allowed"
                            title="Cannot delete field that is assigned to projects. Please set to 0 projects first."
                          >
                            <Trash2 size={16} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main">{editingField ? 'Edit custom field' : 'Create custom field'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 border-b border-border flex space-x-6">
                <button 
                  type="button"
                  onClick={() => setActiveTab('GENERAL')}
                  className={cn("pb-3 pt-4 text-sm font-bold border-b-2 transition-colors", activeTab === 'GENERAL' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
                >
                  General
                </button>
                {isListType && (
                  <button 
                    type="button"
                    onClick={() => setActiveTab('VALUES')}
                    className={cn("pb-3 pt-4 text-sm font-bold border-b-2 transition-colors", activeTab === 'VALUES' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
                  >
                    Values
                  </button>
                )}
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'GENERAL' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-text-main mb-2">Title <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="E.g. description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-main mb-2">Entity</label>
                        <select 
                          className="w-full bg-surface-hover border border-border rounded-md px-3 py-2 text-text-muted outline-none appearance-none cursor-not-allowed"
                          disabled
                        >
                          <option>Test case</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-main mb-2">Type <span className="text-red-500">*</span></label>
                        <select 
                          value={type}
                          onChange={(e) => {
                            setType(e.target.value);
                            if (e.target.value !== 'SELECT' && e.target.value !== 'MULTI_SELECT' && e.target.value !== 'RADIO') {
                              setActiveTab('GENERAL');
                            }
                          }}
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          disabled={editingField?.isSystem}
                        >
                          <option value="NUMBER">Number</option>
                          <option value="STRING">Short text</option>
                          <option value="TEXT">Paragraph</option>
                          <option value="SELECT">Select list (single)</option>
                          <option value="CHECKBOX">Checkbox</option>
                          <option value="RADIO">Radio</option>
                          <option value="MULTI_SELECT">Select list (multi)</option>
                          <option value="USER_PICKER">User picker</option>
                          <option value="URL">URL</option>
                          <option value="DATE_PICKER">Date picker</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 mb-2">
                        <input 
                          type="checkbox" 
                          checked={isGlobal}
                          onChange={(e) => setIsGlobal(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                        />
                        <span className="text-sm font-semibold text-text-main">Enable for all projects</span>
                      </label>
                      <p className="text-xs text-text-muted ml-7 mb-4">The custom field will be available for every project in the workspace.</p>
                      
                      {!isGlobal && (
                        <div className="ml-7 relative">
                          <div 
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-text-main flex justify-between items-center cursor-pointer"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            <span className="text-sm">{projectIds.length > 0 ? `${projectIds.length} projects selected` : 'Select projects...'}</span>
                            <svg className={`w-4 h-4 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          {isDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-y-auto py-2">
                              {allProjects.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-text-muted text-center">No projects available</div>
                              ) : (
                                allProjects.map(p => (
                                  <label key={p.id} className="flex items-center px-3 py-2 hover:bg-surface-hover cursor-pointer space-x-3 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={projectIds.includes(p.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setProjectIds([...projectIds, p.id]);
                                        else setProjectIds(projectIds.filter(id => id !== p.id));
                                      }}
                                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">{p.code}</span>
                                      <span className="text-sm text-text-main">{p.name}</span>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          checked={isRequired}
                          onChange={(e) => setIsRequired(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                        />
                        <span className="text-sm font-semibold text-text-main">Required field</span>
                      </label>
                    </div>
                  </>
                )}

                {activeTab === 'VALUES' && isListType && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <div className="bg-background border border-border px-3 py-2 rounded-md flex-1 flex items-center shadow-sm">
                            <input 
                              type="text" 
                              value={opt.value}
                              onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-text-main text-sm"
                              placeholder={`Option ${idx + 1}`}
                            />
                          </div>
                          <button type="button" onClick={() => handleRemoveOption(opt.id)} className="text-text-muted p-2 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleAddOption} className="text-primary text-sm font-bold flex items-center hover:text-blue-700 transition-colors">
                      <Plus size={16} className="mr-1" /> Add new value
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-surface-hover flex justify-end space-x-3 border-t border-border rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:bg-border rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors flex items-center shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
