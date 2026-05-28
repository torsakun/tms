// components/repository/SuiteTree.tsx
"use client";
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from 'lucide-react';
import { Suite } from '@/types/repository';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjectRole } from '@/components/providers/ProjectRoleProvider';
import { useSuiteExpansion } from '@/components/providers/SuiteExpansionProvider';

interface SuiteItemProps {
  suite: any;
  level: number;
  projectCode: string;
  selectedSuiteId: string | null;
  onAddChild: (parentId: string) => void;
}

const SuiteItem = ({ suite, level, projectCode, selectedSuiteId, onAddChild }: SuiteItemProps) => {
  const router = useRouter();
  const { role } = useProjectRole();
  const { isExpanded, toggleSuite } = useSuiteExpansion();
  const isOpen = isExpanded(suite.id);
  const hasChildren = suite.children && suite.children.length > 0;

  return (
    <div className="select-none group/item">
      <div
        onClick={() => router.push(`/projects/${projectCode}/repository?suite=${suite.id}`)}
        className={cn(
          "flex items-center py-1.5 pr-2 rounded-none cursor-pointer transition-colors relative",
          level === 0 ? "font-bold text-[15px]" : "font-semibold text-[14px]",
          selectedSuiteId === suite.id ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSuite(suite.id);
          }}
          className={cn("p-0.5 rounded mr-1 transition-colors", selectedSuiteId === suite.id ? "text-blue-500 hover:text-blue-700" : "text-slate-500 hover:text-slate-700")}
        >
          {isOpen ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7l5 5-5 5z"/></svg>}
        </button>

        <span className="truncate">{suite.title}</span>

        <div className="ml-auto flex items-center pl-2">
          {suite.caseCount !== undefined && (
            <span className="text-[12px] text-slate-500 font-medium w-6 text-right group-hover/item:hidden">
              {suite.caseCount}
            </span>
          )}

          {role !== 'VIEWER' && (
            <div className="hidden group-hover/item:flex items-center text-slate-400">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOpen) toggleSuite(suite.id);
                  onAddChild(suite.id);
                }}
                className="p-0.5 hover:text-slate-800 transition-colors mx-1"
                title="Add child suite"
              >
                <Plus size={14} />
              </button>
              <button className="p-0.5 hover:text-slate-800 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div 
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen && hasChildren ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden mt-0.5">
          {hasChildren && suite.children!.map((child: any) => (
            <SuiteItem key={child.id} suite={child} level={level + 1} projectCode={projectCode} selectedSuiteId={selectedSuiteId} onAddChild={onAddChild} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SuiteTree = ({ initialSuites, cases = [], projectCode }: { initialSuites: any[], cases?: any[], projectCode: string }) => {
  const [suites, setSuites] = useState<any[]>(initialSuites);

  React.useEffect(() => {
    setSuites(initialSuites);
  }, [initialSuites]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useProjectRole();
  const { expandAll, collapseAll } = useSuiteExpansion();
  const selectedSuiteId = searchParams.get('suite');

  // Build tree from flat array and calculate case counts
  const buildTree = (flatList: any[], allCases: any[]) => {
    const map = new Map();
    const roots: any[] = [];
    
    // Group cases by suite
    const casesBySuite = new Map<string, number>();
    allCases.forEach(tc => {
      const sId = tc.suiteId || 'unassigned';
      casesBySuite.set(sId, (casesBySuite.get(sId) || 0) + 1);
    });
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });
    flatList.forEach(item => {
      const node = map.get(item.id);
      if (item.parentId) {
        if (map.has(item.parentId)) {
          map.get(item.parentId).children.push(node);
        } else {
          roots.push(node); // Fallback if parent missing
        }
      } else {
        roots.push(node);
      }
    });

    // Recursively calculate counts
    const calculateCounts = (node: any) => {
      let count = casesBySuite.get(node.id) || 0;
      node.children.forEach((child: any) => {
        count += calculateCounts(child);
      });
      node.caseCount = count;
      return count;
    };

    roots.forEach(calculateCounts);

    return roots;
  };

  const suiteTree = React.useMemo(() => buildTree(suites, cases), [suites, cases]);
  const unassignedCount = React.useMemo(() => cases.filter(tc => !tc.suiteId).length, [cases]);

  const handleAddSuite = async (parentId: string | null) => {
    const title = window.prompt("Enter Suite Name:");
    if (!title) return;

    try {
      const res = await fetch(`/api/projects/${projectCode}/suites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, parentId })
      });
      if (res.ok) {
        const newSuite = await res.json();
        setSuites([...suites, newSuite]);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white transition-colors">
      <div className="px-4 py-3 border-b border-border/50 bg-white flex justify-between items-center shrink-0 transition-colors">
        <div className="flex items-center space-x-2 text-slate-800">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          <h2 className="font-semibold text-[15px]">Suites</h2>
          {role !== 'VIEWER' && (
            <button onClick={() => handleAddSuite(null)} className="text-slate-400 hover:text-slate-700 ml-1">
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <button onClick={() => expandAll(suites.map(s => s.id))} className="hover:text-slate-700 p-1" title="Expand all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
          <button onClick={() => collapseAll(suites.map(s => s.id))} className="hover:text-slate-700 p-1" title="Collapse all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {suiteTree.map((suite) => (
          <SuiteItem key={suite.id} suite={suite} level={0} projectCode={projectCode} selectedSuiteId={selectedSuiteId} onAddChild={handleAddSuite} />
        ))}
        {unassignedCount > 0 && (
          <SuiteItem 
            key="unassigned"
            suite={{ id: 'unassigned', title: 'Unassigned Test Cases', caseCount: unassignedCount, children: [] }}
            level={0}
            projectCode={projectCode}
            selectedSuiteId={selectedSuiteId}
            onAddChild={() => {}}
          />
        )}
      </div>
    </div>
  );
};