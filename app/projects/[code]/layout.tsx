import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProjectRole } from "@/lib/project-auth";
import { ProjectRoleProvider } from "@/components/providers/ProjectRoleProvider";
import { redirect } from "next/navigation";

export default async function ProjectCodeLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const role = await getProjectRole(code, (session.user as any).id);

  // If role is null, they might not be a member of this project
  if (!role && (session.user as any).role !== 'ADMIN') {
    // If they are a system ADMIN, maybe we let them in? Or maybe not. Let's strictly enforce project membership.
    // For now, if no role, redirect to projects list
    redirect('/projects');
  }

  return (
    <ProjectRoleProvider role={role}>
      <div className="flex flex-1 w-full overflow-hidden bg-background transition-colors">
        <ProjectSidebar projectCode={code} />
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {children}
        </div>
      </div>
    </ProjectRoleProvider>
  );
}
