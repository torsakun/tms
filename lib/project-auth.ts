import { prisma } from "@/lib/prisma";
import { ProjectRole } from "@prisma/client";

export async function getProjectRole(projectCode: string, userId: string): Promise<ProjectRole | null> {
  const project = await prisma.project.findUnique({
    where: { code: projectCode },
    select: { id: true }
  });

  if (!project) return null;

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: project.id
      }
    }
  });

  // If not explicitly added, default to EDITOR to simplify project access
  return member ? member.role : 'EDITOR';
}

export async function requireProjectRole(projectCode: string, userId: string, allowedRoles: ProjectRole[]): Promise<boolean> {
  const role = await getProjectRole(projectCode, userId);
  if (!role) return false;
  return allowedRoles.includes(role);
}
