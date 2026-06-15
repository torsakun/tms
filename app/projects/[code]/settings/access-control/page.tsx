import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/project-auth";
import { redirect } from "next/navigation";
import { AccessControlClient } from "./AccessControlClient";

export default async function AccessControlPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const hasAccess = await requireProjectRole(code, (session.user as any).id, ["ADMIN"]);
  if (!hasAccess && (session.user as any).role !== "ADMIN") {
    redirect(`/projects/${code}/repository`);
  }

  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      groups: { select: { id: true, title: true, description: true, _count: { select: { members: true } } } },
    },
  });

  if (!project) redirect("/projects");

  // Owner = first ADMIN member (or workspace admin)
  const ownerMember = project.members.find(m => m.role === "ADMIN");

  return (
    <div className="pb-12">
      <AccessControlClient
        projectCode={code}
        accessType={project.accessType}
        owner={ownerMember ? { name: ownerMember.user.name, email: ownerMember.user.email } : null}
        assignedGroups={project.groups.map(g => ({ id: g.id, title: g.title, description: g.description, memberCount: g._count.members }))}
        assignedMembers={project.members.map(m => ({ id: m.userId, name: m.user.name, email: m.user.email, role: m.role }))}
      />
    </div>
  );
}
