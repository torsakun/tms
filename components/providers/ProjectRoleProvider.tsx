"use client";

import React, { createContext, useContext } from "react";
import { ProjectRole } from "@prisma/client";

interface ProjectRoleContextType {
  role: ProjectRole | null;
}

const ProjectRoleContext = createContext<ProjectRoleContextType>({ role: null });

export function ProjectRoleProvider({ 
  children, 
  role 
}: { 
  children: React.ReactNode;
  role: ProjectRole | null;
}) {
  return (
    <ProjectRoleContext.Provider value={{ role }}>
      {children}
    </ProjectRoleContext.Provider>
  );
}

export function useProjectRole() {
  return useContext(ProjectRoleContext);
}
