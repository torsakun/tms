"use client";

import React, { createContext, useContext } from "react";
import { ProjectRole } from "@prisma/client";

interface ProjectRoleContextType {
  role: ProjectRole | null;
  isSystemAdmin: boolean;
}

const ProjectRoleContext = createContext<ProjectRoleContextType>({ role: null, isSystemAdmin: false });

export function ProjectRoleProvider({ 
  children, 
  role,
  isSystemAdmin = false
}: { 
  children: React.ReactNode;
  role: ProjectRole | null;
  isSystemAdmin?: boolean;
}) {
  return (
    <ProjectRoleContext.Provider value={{ role, isSystemAdmin }}>
      {children}
    </ProjectRoleContext.Provider>
  );
}

export function useProjectRole() {
  return useContext(ProjectRoleContext);
}
