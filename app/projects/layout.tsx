import { TopNav } from "@/components/layout/TopNav";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background transition-colors">
      <TopNav />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {children}
      </div>
    </div>
  );
}
