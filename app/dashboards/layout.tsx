import { TopNav } from "@/components/layout/TopNav";

export default function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-surface-hover">
      <TopNav />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
