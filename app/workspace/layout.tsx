import { TopNav } from "@/components/layout/TopNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-text-main transition-colors">
      <TopNav />
      <div className="flex-1 flex overflow-hidden w-full">
        <WorkspaceSidebar />
        <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/50 to-blue-50/30 border-l border-border transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
