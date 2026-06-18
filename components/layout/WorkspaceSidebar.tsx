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
  Terminal,
} from "lucide-react";

const ITEM_STYLE: Record<string, { iconColor: string; iconBg: string }> = {
  Users: { iconColor: "#818cf8", iconBg: "rgba(129,140,248,0.18)" },
  Invites: { iconColor: "#c084fc", iconBg: "rgba(192,132,252,0.18)" },
  Groups: { iconColor: "#f472b6", iconBg: "rgba(244,114,182,0.18)" },
  Roles: { iconColor: "#fbbf24", iconBg: "rgba(251,191,36,0.18)" },
  Fields: { iconColor: "#34d399", iconBg: "rgba(52,211,153,0.18)" },
  Deployments: { iconColor: "#fb7185", iconBg: "rgba(251,113,133,0.18)" },
  Settings: { iconColor: "#94a3b8", iconBg: "rgba(148,163,184,0.18)" },
};

const menuGroups = [
  {
    title: "Members",
    items: [
      { name: "Users", href: "/workspace", icon: User },
      { name: "Invites", href: "/workspace/invites", icon: UserPlus },
      { name: "Groups", href: "/workspace/groups", icon: Users },
      { name: "Roles", href: "/workspace/roles", icon: Lock },
      { name: "Fields", href: "/workspace/fields", icon: List },
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
      className={cn(
        "flex flex-col h-full overflow-y-auto shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[64px]" : "w-[220px]",
      )}
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Workspace label row */}
      <div
        className={cn(
          "h-12 flex items-center shrink-0 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        {!collapsed ? (
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Workspace
          </span>
        ) : (
          <div
            className="w-4 h-px"
            style={{ background: "var(--primary-light)" }}
          />
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 flex flex-col gap-5 px-3 pb-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const s = ITEM_STYLE[item.name] ?? ITEM_STYLE.Settings;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-all",
                        collapsed
                          ? "justify-center h-10 w-full"
                          : "gap-3 px-2.5 h-9",
                        isActive ? "" : "hover:bg-surface-hover",
                      )}
                      style={
                        isActive ? { background: "var(--primary-light)" } : {}
                      }
                    >
                      <span
                        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          background: isActive
                            ? s.iconBg
                            : "var(--bg-surface-hover)",
                        }}
                      >
                        <Icon
                          size={13}
                          style={{
                            color: s.iconColor,
                            opacity: isActive ? 1 : 0.65,
                          }}
                        />
                      </span>
                      {!collapsed && (
                        <span
                          className="truncate font-semibold text-[13px]"
                          style={{
                            color: isActive
                              ? "var(--text-main)"
                              : "var(--text-muted)",
                          }}
                        >
                          {item.name}
                        </span>
                      )}
                      {isActive && !collapsed && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: s.iconColor }}
                        />
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
        <div
          className="space-y-0.5 pt-3"
          style={{ borderTop: "1px solid var(--border-color)" }}
        >
          {(() => {
            const isActive = pathname.startsWith("/workspace/settings");
            const s = ITEM_STYLE.Settings;
            return (
              <Link
                href="/workspace/settings"
                title={collapsed ? "Settings" : undefined}
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all",
                  collapsed ? "justify-center h-10 w-full" : "gap-3 px-2.5 h-9",
                  !isActive && "hover:bg-surface-hover",
                )}
                style={isActive ? { background: "var(--primary-light)" } : {}}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: isActive ? s.iconBg : "var(--bg-surface-hover)",
                  }}
                >
                  <Settings
                    size={13}
                    style={{ color: s.iconColor, opacity: isActive ? 1 : 0.65 }}
                  />
                </span>
                {!collapsed && (
                  <span
                    className="truncate font-semibold text-[13px]"
                    style={{
                      color: isActive ? "var(--text-main)" : "var(--text-muted)",
                    }}
                  >
                    Settings
                  </span>
                )}
                {isActive && !collapsed && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: s.iconColor }}
                  />
                )}
              </Link>
            );
          })()}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center w-full rounded-xl transition-all font-medium text-sm hover:bg-surface-hover",
              collapsed ? "justify-center h-10" : "gap-3 px-2.5 h-9",
            )}
            style={{ color: "var(--text-muted)" }}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span className="text-[13px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
