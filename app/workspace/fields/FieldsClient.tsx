"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Check, X, Edit2, Loader2, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Delete field</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

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
  isActive: boolean;
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
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [order, setOrder] = useState<number>(0);

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
    setOrder(fields.length + 1);
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
    setOrder(field.order);
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
        order,
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
        toast.success(editingField ? "Field updated" : "Field created");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save field");
      }
    } catch (err) {
      console.error("Failed to save field:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/workspace/fields/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchFields();
        toast.success("Field deleted");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete field");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleToggleActive = async (field: CustomField) => {
    // Optimistic update
    setFields(prev => prev.map(f => f.id === field.id ? { ...f, isActive: !f.isActive } : f));
    try {
      const res = await fetch(`/api/workspace/fields/${field.id}/toggle`, { method: "POST" });
      if (!res.ok) {
        setFields(prev => prev.map(f => f.id === field.id ? { ...f, isActive: field.isActive } : f));
        toast.error("Failed to update field");
      } else {
        toast.success(field.isActive ? `"${field.name}" disabled` : `"${field.name}" enabled`);
      }
    } catch {
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, isActive: field.isActive } : f));
      toast.error("Something went wrong");
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

  const filteredFields = fields.filter(f =>
    !search.trim() || f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Fields</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">{fields.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          <Plus size={15} /> Create custom field
        </button>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search fields…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
          />
        </div>
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
              {filteredFields.map((field) => (
                <tr key={field.id} className={`hover:bg-surface-hover/50 transition-colors ${!field.isActive ? "opacity-40" : ""}`}>
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
                  <td className="px-6 py-3 text-sm text-text-muted">{field.order}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(field)}
                        className={`p-1.5 transition-colors rounded ${field.isActive ? "text-text-muted hover:text-indigo-600 hover:bg-indigo-50" : "text-amber-500 hover:text-amber-600 hover:bg-amber-50"}`}
                        title={field.isActive ? "Disable this field" : "Enable this field"}
                      >
                        {field.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                                      <button
                        onClick={() => openEditModal(field)}
                        className="text-text-muted hover:text-text-main p-1.5 transition-colors"
                        title="Edit field"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!field.isSystem && (
                        (!field.isGlobal && field.projectIds && field.projectIds.length === 0) ? (
                          <button
                            onClick={() => setConfirmDeleteId(field.id)}
                            className="text-text-muted hover:text-red-500 p-1.5 transition-colors"
                            title="Delete custom field"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-slate-300 p-1.5 cursor-not-allowed"
                            title="Remove from all projects before deleting"
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

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this custom field? This cannot be undone."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
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
                      <div>
                        <label className="block text-sm font-semibold text-text-main mb-2">Order</label>
                        <input
                          type="number"
                          min={1}
                          value={order}
                          onChange={(e) => setOrder(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                    </div>

                    {!editingField?.isSystem && (
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
                    )}

                    {!editingField?.isSystem && (
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
                    )}

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
