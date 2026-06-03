"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  User, 
  UserPlus, 
  Users, 
  Lock, 
  List, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal
} from "lucide-react";


export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuGroups = [
    {
      title: "WORKSPACE",
      items: [
        { name: "Users", href: `/workspace`, icon: User },
        { name: "Invites", href: `/workspace/invites`, icon: UserPlus },
        { name: "Groups", href: `/workspace/groups`, icon: Users },
        { name: "Roles", href: `/workspace/roles`, icon: Lock },
        { name: "Fields", href: `/workspace/fields`, icon: List },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Deployments", href: `/workspace/deployments`, icon: Terminal },
      ]
    }
  ];

  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-indigo-950 to-slate-950 flex flex-col h-full overflow-y-auto transition-all duration-300 ease-in-out shrink-0 text-white border-r border-white/10 z-10",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Workspace Header */}
      <div className={cn("p-6 flex items-center transition-all", isCollapsed ? "justify-center px-0" : "")}>
        <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          S9
        </div>
        {!isCollapsed && (
          <h2 className="ml-3 font-bold text-white truncate transition-opacity duration-200 text-lg tracking-tight">
            Socket 9
          </h2>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 pb-6 space-y-6 flex flex-col">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider px-3 mb-3 flex items-center justify-between">
                {group.title}
              </h3>
            )}
            {isCollapsed && (
              <div className="h-4 mb-3 w-8 mx-auto" />
            )}
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-lg font-medium transition-all duration-200 group",
                        isCollapsed ? "justify-center py-2.5 px-0 mx-3" : "px-3 py-2 text-sm",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          "shrink-0",
                          !isCollapsed && "mr-3",
                          isActive ? "text-white" : "text-indigo-300 group-hover:text-white"
                        )} 
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex-1" />

        {/* Theme Toggle Removed */}

        {/* Settings & Collapse */}
        <div className="pt-4 border-t border-border mt-auto">
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/workspace/settings"
                title={isCollapsed ? "Settings" : undefined}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-all duration-200 group mx-3",
                  isCollapsed ? "justify-center py-2.5 px-0" : "px-3 py-2 text-sm",
                  pathname.startsWith("/workspace/settings")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Settings 
                  size={18} 
                  className={cn(
                    "shrink-0",
                    !isCollapsed && "mr-3",
                    pathname.startsWith("/workspace/settings") ? "text-white" : "text-indigo-300 group-hover:text-white"
                  )} 
                />
                {!isCollapsed && <span className="truncate">Settings</span>}
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand submenu" : undefined}
                className={cn(
                  "flex items-center w-full rounded-lg font-medium transition-all duration-200 group text-white/70 hover:text-white hover:bg-white/10 mx-3 mt-1",
                  isCollapsed ? "justify-center py-2.5 px-0" : "px-3 py-2 text-sm"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight size={18} className="shrink-0 text-indigo-300 group-hover:text-white" />
                ) : (
                  <>
                    <ChevronLeft size={18} className="shrink-0 mr-3 text-indigo-300 group-hover:text-white" />
                    <span className="truncate">Collapse</span>
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
