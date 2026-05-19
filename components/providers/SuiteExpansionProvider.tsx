"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface SuiteExpansionContextType {
  expandedSuites: Set<string>;
  toggleSuite: (id: string) => void;
  expandAll: (suiteIds: string[]) => void;
  collapseAll: (suiteIds: string[]) => void;
  isExpanded: (id: string) => boolean;
}

const SuiteExpansionContext = createContext<SuiteExpansionContextType | null>(null);

export function SuiteExpansionProvider({ 
  children,
  projectCode = "default"
}: { 
  children: React.ReactNode,
  initialExpandedIds?: string[], // Kept for backwards compatibility but ignored
  projectCode?: string
}) {
  const storageKey = `tms_suite_collapse_${projectCode}`;
  const [collapsedSuites, setCollapsedSuites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCollapsedSuites(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Failed to load suite collapse state", e);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save to local storage whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedSuites)));
    }
  }, [collapsedSuites, isLoaded, storageKey]);

  const toggleSuite = useCallback((id: string) => {
    setCollapsedSuites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id); // expanding
      } else {
        next.add(id); // collapsing
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((suiteIds: string[]) => {
    // To expand all, we clear the collapsed set
    setCollapsedSuites(new Set());
  }, []);

  const collapseAll = useCallback((suiteIds: string[]) => {
    // To collapse all, we add all known suite ids to the collapsed set
    setCollapsedSuites(new Set(suiteIds));
  }, []);

  const isExpanded = useCallback((id: string) => {
    return !collapsedSuites.has(id);
  }, [collapsedSuites]);

  // We return expandedSuites as an empty set to satisfy the context type if it was used directly, 
  // but clients should use `isExpanded`
  const dummyExpandedSuites = new Set<string>();

  return (
    <SuiteExpansionContext.Provider value={{ 
      expandedSuites: dummyExpandedSuites, 
      toggleSuite, 
      expandAll, 
      collapseAll,
      isExpanded 
    }}>
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
