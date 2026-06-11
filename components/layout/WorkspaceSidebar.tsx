"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, UserPlus, Users, Lock, List, Settings, ChevronLeft, ChevronRight, Terminal } from "lucide-react";

// Each item gets its own vibrant color
const ITEM_STYLE: Record<string, { iconBg: string; iconColor: string; activeBg: string; activeText: string }> = {
  Users:       { iconBg: "#eef2ff", iconColor: "#4f46e5", activeBg: "#eef2ff", activeText: "#4338ca" },
  Invites:     { iconBg: "#fdf4ff", iconColor: "#a855f7", activeBg: "#fdf4ff", activeText: "#9333ea" },
  Groups:      { iconBg: "#fff0fb", iconColor: "#ec4899", activeBg: "#fff0fb", activeText: "#db2777" },
  Roles:       { iconBg: "#fffbeb", iconColor: "#f59e0b", activeBg: "#fffbeb", activeText: "#d97706" },
  Fields:      { iconBg: "#f0fdf4", iconColor: "#10b981", activeBg: "#f0fdf4", activeText: "#059669" },
  Deployments: { iconBg: "#fff1f2", iconColor: "#f43f5e", activeBg: "#fff1f2", activeText: "#e11d48" },
  Settings:    { iconBg: "#f1f5f9", iconColor: "#64748b", activeBg: "#f1f5f9", activeText: "#475569" },
};

const menuGroups = [
  {
    title: "Members",
    items: [
      { name: "Users",   href: "/workspace",            icon: User     },
      { name: "Invites", href: "/workspace/invites",    icon: UserPlus },
      { name: "Groups",  href: "/workspace/groups",     icon: Users    },
      { name: "Roles",   href: "/workspace/roles",      icon: Lock     },
      { name: "Fields",  href: "/workspace/fields",     icon: List     },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Deployments", href: "/workspace/deployments", icon: Terminal },
    ],
  },
];

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn("flex flex-col h-full overflow-y-auto shrink-0 transition-all duration-300 ease-in-out", collapsed ? "w-[64px]" : "w-[220px]")}
      style={{ background: "#fff", borderRight: "1px solid #e8eaf2" }}>

      {/* Workspace label row */}
      <div className={cn("h-12 flex items-center shrink-0 px-4", collapsed && "justify-center px-0")}>
        {!collapsed
          ? <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Workspace</span>
          : <div className="w-4 h-px bg-slate-200" />
        }
      </div>

      {/* Nav groups */}
      <div className="flex-1 flex flex-col gap-5 px-3 pb-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 px-2 mb-1.5">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const s = ITEM_STYLE[item.name] ?? ITEM_STYLE.Settings;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link href={item.href} title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-all",
                        collapsed ? "justify-center h-10 w-full" : "gap-3 px-2.5 h-9",
                        isActive ? "shadow-sm" : "hover:bg-slate-50"
                      )}
                      style={isActive ? { background: s.activeBg } : {}}>
                      {/* Icon bubble — always coloured, brighter when active */}
                      <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: isActive ? s.iconBg : `${s.iconColor}14` }}>
                        <Icon size={13} style={{ color: s.iconColor, opacity: isActive ? 1 : 0.7 }} />
                      </span>
                      {!collapsed && (
                        <span className="truncate font-semibold text-[13px]"
                          style={{ color: isActive ? s.activeText : "#4b5563" }}>
                          {item.name}
                        </span>
                      )}
                      {/* Active indicator dot */}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: s.iconColor }} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex-1" />

        {/* Settings + Collapse */}
        <div className="space-y-0.5 pt-3" style={{ borderTop: "1px solid #f1f3f9" }}>
          {(() => {
            const isActive = pathname.startsWith("/workspace/settings");
            const s = ITEM_STYLE.Settings;
            return (
              <Link href="/workspace/settings" title={collapsed ? "Settings" : undefined}
                className={cn("flex items-center rounded-xl text-sm font-medium transition-all", collapsed ? "justify-center h-10 w-full" : "gap-3 px-2.5 h-9", isActive ? "shadow-sm" : "hover:bg-slate-50")}
                style={isActive ? { background: s.activeBg } : {}}>
                <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isActive ? s.iconBg : `${s.iconColor}14` }}>
                  <Settings size={13} style={{ color: s.iconColor, opacity: isActive ? 1 : 0.7 }} />
                </span>
                {!collapsed && <span className="truncate font-semibold text-[13px]" style={{ color: isActive ? s.activeText : "#64748b" }}>Settings</span>}
                {isActive && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.iconColor }} />}
              </Link>
            );
          })()}

          <button onClick={() => setCollapsed(!collapsed)}
            className={cn("flex items-center w-full rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-medium text-sm", collapsed ? "justify-center h-10" : "gap-3 px-2.5 h-9")}>
            {collapsed
              ? <ChevronRight size={14} />
              : <><ChevronLeft size={14} /><span className="text-[13px]">Collapse</span></>
            }
          </button>
        </div>
      </div>
    </aside>
  );
}
