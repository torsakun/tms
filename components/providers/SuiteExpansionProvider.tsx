"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SuiteExpansionContextType {
  expandedSuites: Set<string>;
  toggleSuite: (id: string) => void;
  expandAll: (suiteIds: string[]) => void;
  collapseAll: () => void;
  isExpanded: (id: string) => boolean;
}

const SuiteExpansionContext = createContext<SuiteExpansionContextType | null>(null);

export function SuiteExpansionProvider({ 
  children,
  initialExpandedIds = []
}: { 
  children: React.ReactNode,
  initialExpandedIds?: string[]
}) {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set(initialExpandedIds));

  const toggleSuite = useCallback((id: string) => {
    setExpandedSuites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((suiteIds: string[]) => {
    setExpandedSuites(new Set(suiteIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSuites(new Set());
  }, []);

  const isExpanded = useCallback((id: string) => {
    return expandedSuites.has(id);
  }, [expandedSuites]);

  return (
    <SuiteExpansionContext.Provider value={{ expandedSuites, toggleSuite, expandAll, collapseAll, isExpanded }}>
      {children}
    </SuiteExpansionContext.Provider>
  );
}

export function useSuiteExpansion() {
  const context = useContext(SuiteExpansionContext);
  if (!context) {
    throw new Error("useSuiteExpansion must be used within a SuiteExpansionProvider");
  }
  return context;
}
