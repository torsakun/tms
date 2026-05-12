import { TopNav } from "@/components/layout/TopNav";

export default function DashboardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      <TopNav />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {children}
      </div>
    </div>
  );
}
