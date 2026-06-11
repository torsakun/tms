import { TopNav } from "@/components/layout/TopNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-text-main transition-colors">
      <TopNav />
      <div className="flex-1 flex overflow-hidden w-full">
        <WorkspaceSidebar />
        <main className="flex-1 flex flex-col overflow-y-auto bg-background transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
