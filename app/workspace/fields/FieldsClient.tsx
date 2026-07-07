"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Check,
  RefreshCw,
  GripVertical,
  X,
  MoreHorizontal,
  Type,
  AlignLeft,
  ChevronDownCircle,
  ListChecks,
  CheckSquare,
  Hash,
  CircleDot,
  Calendar,
  User,
  Link as LinkIcon,
  LucideIcon,
} from "lucide-react";

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

const TYPE_CONFIG: Record<string, { label: string, icon: LucideIcon, bg: string, color: string, ring?: string }> = {
  STRING: { label: "String", icon: Type, bg: "var(--surface-2)", color: "var(--text-muted)" },
  TEXT: { label: "Text", icon: AlignLeft, bg: "var(--surface-2)", color: "var(--text-muted)" },
  SELECT: { label: "Select", icon: ChevronDownCircle, bg: "var(--primary-soft)", color: "var(--primary-text)" },
  MULTI_SELECT: { label: "Multi", icon: ListChecks, bg: "var(--primary-soft)", color: "var(--primary-text)" },
  CHECKBOX: { label: "Checkbox", icon: CheckSquare, bg: "var(--pass-soft)", color: "var(--pass)" },
  NUMBER: { label: "Number", icon: Hash, bg: "var(--info-soft-fill)", color: "var(--info)" },
  RADIO: { label: "Radio", icon: CircleDot, bg: "var(--primary-soft)", color: "var(--primary-text)" },
  DATE_PICKER: { label: "Date", icon: Calendar, bg: "var(--info-soft-fill)", color: "var(--info)" },
  USER_PICKER: { label: "User picker", icon: User, bg: "var(--warn-soft)", color: "var(--warn)" },
  URL: { label: "URL", icon: LinkIcon, bg: "var(--surface-2)", color: "var(--text-muted)" },
};

const AVAILABLE_TYPES = ["STRING", "TEXT", "SELECT", "MULTI_SELECT", "CHECKBOX", "NUMBER", "RADIO", "DATE_PICKER"];

export default function FieldsClient() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor state
  const [editingId, setEditingId] = useState<string | null>("new");
  const [name, setName] = useState("");
  const [type, setType] = useState("SELECT");
  const [options, setOptions] = useState<FieldOption[]>([{ id: Date.now().toString(), value: "" }]);
  const [isGlobal, setIsGlobal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchFields = useCallback(() => {
    fetch("/api/workspace/fields")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFields(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleEdit = (field: CustomField) => {
    if (field.isSystem) return; // Cannot edit system fields directly in this simplified UI
    setEditingId(field.id);
    setName(field.name);
    setType(field.type);
    setOptions(field.options || [{ id: Date.now().toString(), value: "" }]);
    setIsGlobal(field.isGlobal !== false);
  };

  const handleCreateNew = () => {
    setEditingId("new");
    setName("");
    setType("SELECT");
    setOptions([{ id: Date.now().toString(), value: "" }]);
    setIsGlobal(true);
  };

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now().toString(), value: "" }]);
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, value } : opt)));
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleToggleActive = async (field: CustomField, e: React.MouseEvent) => {
    e.stopPropagation();
    setFields((prev) => prev.map((f) => f.id === field.id ? { ...f, isActive: !f.isActive } : f));
    try {
      const res = await fetch(`/api/workspace/fields/${field.id}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(field.isActive ? "Field disabled" : "Field enabled");
    } catch {
      setFields((prev) => prev.map((f) => f.id === field.id ? { ...f, isActive: field.isActive } : f));
      toast.error("Failed to toggle field");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/workspace/fields/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Field deleted");
        if (editingId === id) handleCreateNew();
        fetchFields();
      } else {
        toast.error("Failed to delete field");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Label is required");
      return;
    }
    setIsSubmitting(true);
    
    const isListType = type === "SELECT" || type === "MULTI_SELECT" || type === "RADIO";
    const validOptions = isListType ? options.filter(o => o.value.trim() !== "") : null;
    
    try {
      const url = editingId === "new" ? "/api/workspace/fields" : `/api/workspace/fields/${editingId}`;
      const method = editingId === "new" ? "POST" : "PUT";
      
      const payload = {
        name,
        type,
        isRequired: false,
        isGlobal,
        projectIds: [],
        order: editingId === "new" ? fields.length + 1 : fields.find(f => f.id === editingId)?.order || 0,
        options: validOptions
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId === "new" ? "Field created" : "Field updated");
        if (editingId === "new") handleCreateNew();
        fetchFields();
      } else {
        toast.error("Failed to save field");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1120px] mx-auto p-[20px_22px] flex justify-center min-h-[400px] items-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isListType = type === "SELECT" || type === "MULTI_SELECT" || type === "RADIO";

  return (
    <div className="w-full max-w-[1120px] mx-auto p-[20px_22px] grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-[18px] items-start antialiased font-sans">
      
      {/* field list */}
      <div>
        <div className="flex items-center gap-[12px] mb-[14px]">
          <div className="text-[16px] font-semibold text-text-main">
            Custom fields <span className="text-text-faint font-normal">· {fields.length}</span>
          </div>
          <div className="flex-1" />
          <Button onClick={handleCreateNew} variant="primary" size="sm">
            <Plus size={16} />
            New field
          </Button>
        </div>
        
        <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.4fr_110px_86px_52px_36px] gap-[12px] p-[10px_16px] text-[10px] font-semibold tracking-[0.05em] uppercase text-text-faint border-b border-border bg-surface-hover/30">
            <div>Label</div>
            <div>Type</div>
            <div>Scope</div>
            <div>On</div>
            <div></div>
          </div>
          
          {fields.map((f) => {
            const config = TYPE_CONFIG[f.type] || TYPE_CONFIG["STRING"];
            const Icon = config.icon;
            const isSystem = f.isSystem;
            const scopeText = f.isGlobal !== false ? "Global" : "Per-project";

            return (
              <div 
                key={f.id} 
                onClick={() => !isSystem && handleEdit(f)}
                className={`grid grid-cols-[1.4fr_110px_86px_52px_36px] gap-[12px] p-[11px_16px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors group ${isSystem ? "" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-[9px] min-w-0">
                  <Icon size={16} className="text-text-faint shrink-0" />
                  <div className="min-w-0 truncate flex items-center">
                    <span className="text-[13px] font-medium text-text-main truncate">{f.name}</span>
                    {isSystem && <span className="text-[9.5px] font-bold p-[1px_6px] rounded-[5px] bg-surface-2 text-text-faint ml-[6px] shrink-0 uppercase tracking-wider">System</span>}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold p-[2px_8px] rounded-[6px]" style={{ background: config.bg, color: config.color }}>
                    {config.label}
                  </span>
                </div>
                <div className="text-[11.5px] text-text-muted truncate">{scopeText}</div>
                <div onClick={(e) => handleToggleActive(f, e)}>
                  <div className="w-[32px] h-[19px] rounded-full relative cursor-pointer transition-colors" style={{ background: f.isActive ? "var(--primary)" : "var(--surface-2)" }}>
                    <div className="absolute top-[2px] w-[15px] h-[15px] rounded-full bg-white transition-all shadow-sm" style={{ left: f.isActive ? "15px" : "2px" }} />
                  </div>
                </div>
                <div className="flex justify-center text-text-faint relative group/menu" onClick={e => e.stopPropagation()}>
                  {!isSystem && (
                    <>
                      <button className="hover:text-text-main flex items-center"><MoreHorizontal size={18} /></button>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-[9px] shadow-sm opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                        <button 
                          onClick={() => setConfirmDeleteId(f.id)}
                          className="w-full text-left px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger-soft transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {fields.length === 0 && (
            <div className="p-8 text-center text-text-muted text-[13px]">No custom fields found.</div>
          )}
        </div>
      </div>

      {/* create field form */}
      {(editingId || editingId === "new") && (
        <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden sticky top-6">
          <div className="p-[14px_16px] border-b border-border font-semibold text-[14px] text-text-main flex items-center justify-between">
            {editingId === "new" ? "New custom field" : "Edit custom field"}
          </div>
          
          <div className="p-[16px] flex flex-col gap-[15px]">
            <div>
              <label className="block text-[12px] text-text-muted mb-[6px]">Label</label>
              <div className="flex items-center h-[40px] px-[12px] rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13.5px] focus-within:shadow-[inset_0_0_0_2px_var(--ring)] transition-shadow">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Severity"
                  className="w-full bg-transparent outline-none text-text-main font-semibold"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[12px] text-text-muted mb-[7px]">Type</label>
              <div className="flex flex-wrap gap-[6px]">
                {AVAILABLE_TYPES.map(t => {
                  const sel = type === t;
                  const bg = sel ? "var(--primary-soft)" : "var(--surface-2)";
                  const color = sel ? "var(--primary-text)" : "var(--text-muted)";
                  const ring = sel ? "inset 0 0 0 1px var(--primary-border)" : "none";
                  const c = TYPE_CONFIG[t];
                  return (
                    <button 
                      key={t}
                      onClick={() => setType(t)}
                      className="text-[11.5px] font-semibold p-[5px_11px] rounded-[8px] transition-all"
                      style={{ background: bg, color, boxShadow: ring }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {isListType && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-[12px] text-text-muted mb-[7px]">
                  Options <span className="text-text-faint">· for select / radio</span>
                </label>
                <div className="flex flex-col gap-[7px]">
                  {options.map((o, idx) => (
                    <div key={o.id} className="flex items-center gap-[9px] h-[36px] px-[11px] rounded-[9px] bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-[13px] focus-within:shadow-[inset_0_0_0_2px_var(--ring)] transition-shadow">
                      <GripVertical size={16} className="text-text-faint cursor-grab shrink-0" />
                      <input
                        type="text" 
                        value={o.value}
                        onChange={e => handleOptionChange(o.id, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-transparent outline-none text-text-main"
                      />
                      <button onClick={() => handleRemoveOption(o.id)} className="text-text-faint hover:text-danger ml-auto flex items-center"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={handleAddOption} className="flex items-center gap-[7px] p-[4px_2px] text-primary-text text-[12.5px] font-semibold hover:opacity-80 transition-opacity w-fit mt-1">
                    <Plus size={16} />Add option
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[12px] text-text-muted mb-[7px]">Scope</label>
              <div className="flex gap-[6px]">
                <button 
                  onClick={() => setIsGlobal(true)}
                  className="flex-1 flex items-center justify-center gap-[5px] h-[34px] rounded-[8px] text-[12px] font-semibold transition-all"
                  style={{ 
                    background: isGlobal ? "var(--primary-soft)" : "transparent", 
                    color: isGlobal ? "var(--primary-text)" : "var(--text-muted)", 
                    boxShadow: isGlobal ? "inset 0 0 0 1px var(--primary-border)" : "inset 0 0 0 1px var(--border)"
                  }}
                >
                  Global
                </button>
                <button 
                  onClick={() => setIsGlobal(false)}
                  className="flex-1 flex items-center justify-center gap-[5px] h-[34px] rounded-[8px] text-[12px] font-semibold transition-all"
                  style={{ 
                    background: !isGlobal ? "var(--primary-soft)" : "transparent", 
                    color: !isGlobal ? "var(--primary-text)" : "var(--text-muted)", 
                    boxShadow: !isGlobal ? "inset 0 0 0 1px var(--primary-border)" : "inset 0 0 0 1px var(--border)"
                  }}
                >
                  Per-project
                </button>
              </div>
            </div>
            
          </div>
          
          <div className="flex justify-end gap-[9px] p-[13px_16px] border-t border-border bg-surface">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editingId === "new") {
                  setEditingId(null);
                } else {
                  const f = fields.find(x => x.id === editingId);
                  if (f) handleEdit(f);
                }
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} variant="primary" size="sm">
              {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              {editingId === "new" ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this custom field? This cannot be undone."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
