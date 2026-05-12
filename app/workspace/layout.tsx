import { TopNav } from "@/components/layout/TopNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      <TopNav />
      <div className="flex-1 flex overflow-hidden w-full">
        <WorkspaceSidebar />
        <main className="flex-1 flex flex-col overflow-y-auto bg-white border-l border-slate-200">
          {children}
        </main>
      </div>
    </div>
  );
}
