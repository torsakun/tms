// components/repository/SuiteTree.tsx
"use client";
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from 'lucide-react';
import { Suite } from '@/types/repository';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjectRole } from '@/components/providers/ProjectRoleProvider';

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
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = suite.children && suite.children.length > 0;

  return (
    <div className="select-none">
      <div
        onClick={() => router.push(`/projects/${projectCode}/repository?suite=${suite.id}`)}
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md cursor-pointer group transition-colors",
          level === 0 ? "font-medium text-text-main" : "text-text-muted text-sm",
          selectedSuiteId === suite.id ? "bg-primary/10 text-primary" : "hover:bg-surface-hover"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-0.5 hover:bg-surface-hover rounded mr-1 transition-colors"
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-[14px]" />
          )}
        </button>

        {isOpen ? (
          <FolderOpen size={16} className="mr-2 text-primary" />
        ) : (
          <Folder size={16} className="mr-2 text-text-muted opacity-50" />
        )}

        <span className="flex-1 truncate">{suite.title}</span>

        {suite.caseCount !== undefined && suite.caseCount > 0 && (
          <span className="text-xs text-text-muted/50 ml-2 group-hover:hidden">{suite.caseCount}</span>
        )}

        {role !== 'VIEWER' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
              onAddChild(suite.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity ml-auto"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {suite.children!.map((child: any) => (
            <SuiteItem key={child.id} suite={child} level={level + 1} projectCode={projectCode} selectedSuiteId={selectedSuiteId} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SuiteTree = ({ initialSuites, cases = [], projectCode }: { initialSuites: any[], cases?: any[], projectCode: string }) => {
  const [suites, setSuites] = useState<any[]>(initialSuites);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useProjectRole();
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
    <div className="flex flex-col h-full bg-surface transition-colors">
      <div className="p-4 border-b border-border/50 bg-surface flex justify-between items-center shrink-0 transition-colors">
        <h2 className="font-semibold text-text-main">Suites</h2>
        {role !== 'VIEWER' && (
          <button 
            onClick={() => handleAddSuite(null)}
            className="p-1.5 bg-primary text-white shadow-[0_0_10px_rgba(93,135,255,0.4)] rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {suiteTree.map((suite) => (
          <SuiteItem key={suite.id} suite={suite} level={0} projectCode={projectCode} selectedSuiteId={selectedSuiteId} onAddChild={handleAddSuite} />
        ))}
      </div>
    </div>
  );
};