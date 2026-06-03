"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { cn } from "@/lib/utils";
import { 
  Activity,
  ListTodo, 
  Share2, 
  Eye, 
  FileBarChart, 
  ClipboardList, 
  PlayCircle, 
  Settings2, 
  Box, 
  Users, 
  Bot, 
  Bug, 
  FileText, 
  Flag, 
  Settings 
} from "lucide-react";


export function ProjectSidebar({ projectCode }: { projectCode: string }) {
  const pathname = usePathname();
  const { role, isSystemAdmin } = useProjectRole();

  const menuGroups = [
    {
      title: "WORKSPACE",
      items: [
        { name: "Dashboards", href: `/projects/${projectCode}/dashboards`, icon: FileBarChart },
      ]
    },
    {
      title: "TESTS",
      items: [
        { name: "Repository", href: `/projects/${projectCode}/repository`, icon: ListTodo },
      ]
    },
    {
      title: "EXECUTION",
      items: [
        { name: "Test Plans", href: `/projects/${projectCode}/plans`, icon: ClipboardList },
        { name: "Test Runs", href: `/projects/${projectCode}/runs`, icon: PlayCircle },
      ]
    },
    {
      title: "TESSA",
      items: [
        { name: "Test Automation", href: `/projects/${projectCode}/automation`, icon: Bot },
      ]
    },
  ];

  return (
    <aside className="w-[260px] bg-gradient-to-b from-indigo-950 to-slate-950 flex flex-col h-full overflow-y-auto transition-colors z-10 shrink-0 text-white border-r border-white/10">
      {/* Project Header */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-text-main rounded-lg text-background flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          {projectCode.substring(0, 2).toUpperCase()}
        </div>
        <h2 className="font-bold text-white truncate text-lg tracking-tight">{projectCode}</h2>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 pb-6 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider px-3 mb-3 flex items-center justify-between">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn("mr-3", isActive ? "text-white" : "text-indigo-300 group-hover:text-white")} 
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Theme Toggle Removed */}

        {/* Settings */}
        <div className="pt-4 border-t border-border mt-auto">
          <ul className="space-y-1.5">
            {(role === 'ADMIN' || isSystemAdmin) && (
              <>
                <li>
                  <Link
                    href={`/projects/${projectCode}/settings`}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                      pathname === `/projects/${projectCode}/settings`
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Settings size={18} className={cn("mr-3", pathname === `/projects/${projectCode}/settings` ? "text-white" : "text-indigo-300 group-hover:text-white")} />
                    Settings
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/projects/${projectCode}/settings/integrations`}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                      pathname.startsWith(`/projects/${projectCode}/settings/integrations`)
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <div className="mr-3 w-[18px] flex justify-center">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(pathname.startsWith(`/projects/${projectCode}/settings/integrations`) ? "text-white" : "text-indigo-300 group-hover:text-white")}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                    </div>
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/projects/${projectCode}/activity`}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                      pathname.startsWith(`/projects/${projectCode}/activity`)
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Activity size={18} className={cn("mr-3", pathname.startsWith(`/projects/${projectCode}/activity`) ? "text-white" : "text-indigo-300 group-hover:text-white")} />
                    Audit Logs
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link
                href={`/projects/${projectCode}/shared-steps`}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                  pathname.startsWith(`/projects/${projectCode}/shared-steps`)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Share2 size={18} className={cn("mr-3", pathname.startsWith(`/projects/${projectCode}/shared-steps`) ? "text-white" : "text-indigo-300 group-hover:text-white")} />
                Shared Steps
              </Link>
            </li>
            <li>
              <Link
                href={`/projects/${projectCode}/environments`}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
                  pathname.startsWith(`/projects/${projectCode}/environments`)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Box size={18} className={cn("mr-3", pathname.startsWith(`/projects/${projectCode}/environments`) ? "text-white" : "text-indigo-300 group-hover:text-white")} />
                Environments
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
