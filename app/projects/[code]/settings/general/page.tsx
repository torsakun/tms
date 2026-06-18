import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/project-auth";
import { redirect } from "next/navigation";
import { GeneralSettingsClient } from "./GeneralSettingsClient";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const hasAccess = await requireProjectRole(code, (session.user as any).id, [
    "ADMIN",
  ]);
  if (!hasAccess && (session.user as any).role !== "ADMIN")
    redirect(`/projects/${code}/repository`);

  const project = await prisma.project.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isArchived: true,
    },
  });
  if (!project) redirect("/projects");

  return (
    <div className="pb-12">
      <GeneralSettingsClient project={project} />
    </div>
  );
}
