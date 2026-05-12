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
  ChevronRight
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
  ];

  return (
    <aside 
      className={cn(
        "bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Workspace Header */}
      <div className={cn("p-4 flex items-center transition-all", isCollapsed ? "justify-center" : "")}>
        <div className="w-8 h-8 shrink-0 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          S9
        </div>
        {!isCollapsed && (
          <h2 className="ml-3 font-bold text-white truncate transition-opacity duration-200">
            Socket 9
          </h2>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 pb-6 space-y-6 flex flex-col">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                {group.title}
              </h3>
            )}
            {isCollapsed && (
              <div className="h-6 mb-2 border-b border-slate-800 w-8 mx-auto" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-md font-medium transition-colors group",
                        isCollapsed ? "justify-center py-2 px-0" : "px-3 py-1.5 text-sm",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          "shrink-0",
                          !isCollapsed && "mr-3",
                          isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-slate-500 group-hover:text-slate-300"
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

        {/* Settings & Collapse */}
        <div className="pt-4 border-t border-slate-800 mt-auto">
          <ul className="space-y-1">
            <li>
              <Link
                href="/workspace/settings"
                title={isCollapsed ? "Settings" : undefined}
                className={cn(
                  "flex items-center rounded-md font-medium transition-colors group",
                  isCollapsed ? "justify-center py-2 px-0" : "px-3 py-1.5 text-sm",
                  pathname.startsWith("/workspace/settings")
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Settings 
                  size={18} 
                  className={cn(
                    "shrink-0",
                    !isCollapsed && "mr-3",
                    pathname.startsWith("/workspace/settings") ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-slate-500 group-hover:text-slate-300"
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
                  "flex items-center w-full rounded-md font-medium transition-colors group text-slate-400 hover:bg-white/5 hover:text-white",
                  isCollapsed ? "justify-center py-2 px-0" : "px-3 py-1.5 text-sm"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight size={18} className="shrink-0 text-slate-500 group-hover:text-slate-300 transition-transform hover:translate-x-0.5" />
                ) : (
                  <>
                    <ChevronLeft size={18} className="shrink-0 mr-3 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:-translate-x-0.5" />
                    <span className="truncate">Collapse submenu</span>
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
