import { ProjectSidebar } from "@/components/layout/ProjectSidebar";

export default async function ProjectCodeLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="flex flex-1 w-full overflow-hidden bg-background transition-colors">
      <ProjectSidebar projectCode={code} />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {children}
      </div>
    </div>
  );
}
