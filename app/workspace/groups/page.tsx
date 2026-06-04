"use client";

import { useState, useEffect } from "react";
import { Users, MoreHorizontal, Check, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Mock Data
const MOCK_GROUPS = [
  { id: "g-1", title: "QA Team", description: "Quality Assurance engineers and testers.", members: 12, projects: 5 },
  { id: "g-2", title: "Frontend Developers", description: "UI/UX and frontend engineering team.", members: 8, projects: 3 },
  { id: "g-3", title: "Management", description: "Project managers and stakeholders.", members: 4, projects: 12 },
];

export default function WorkspaceGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroup, setNewGroup] = useState({ title: "", description: "" });

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    // Simulate network delay for realistic feel
    const timer = setTimeout(() => {
      setGroups(MOCK_GROUPS);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateGroup = () => {
    if (!newGroup.title.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const created = {
        id: `g-${Date.now()}`,
        title: newGroup.title,
        description: newGroup.description,
        members: 0,
        projects: 0,
      };
      setGroups([...groups, created]);
      toast.success("Group created successfully");
      setIsSubmitting(false);
      setIsCreateModalOpen(false);
      setNewGroup({ title: "", description: "" });
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    setGroups(groups.filter(g => g.id !== id));
    toast.success("Group deleted successfully");
  };

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Users className="mr-2 text-indigo-600" size={24} />
            User Groups
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage user groups to easily assign permissions across projects.</p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-1" /> Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <Users className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No groups found</h3>
          <p className="text-slate-500 mt-1 mb-4 text-sm max-w-sm text-center">
            You haven't created any groups yet. Groups help you manage permissions and roles for multiple users at once.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl">Group Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Members</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Projects</th>
                <th className="px-6 py-4 w-16 rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50/80 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm group-hover/row:text-indigo-600 transition-colors">{group.title}</span>
                      <span className="text-xs text-slate-500 mt-1">{group.description || "No description provided."}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                      {group.members} users
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                      {group.projects} projects
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setOpenMenuId(openMenuId === group.id ? null : group.id);
                      }}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    {openMenuId === group.id && (
                      <div className="absolute right-12 top-10 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => { toast.info("Edit mode coming soon"); setOpenMenuId(null); }}
                        >
                          Edit Group
                        </button>
                        <button 
                          onClick={() => handleDelete(group.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1 pt-1"
                        >
                          Delete Group
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out Drawer for Create Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Create New Group</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGroup.title}
                  onChange={(e) => setNewGroup({...newGroup, title: e.target.value})}
                  placeholder="e.g. QA Automation Team"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-shadow"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="What is the purpose of this group?"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm h-28 resize-none transition-shadow"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-4">
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong className="font-bold">Note:</strong> User assignment and project access control will be available after the database schema is fully implemented. For now, this is a UI preview.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
