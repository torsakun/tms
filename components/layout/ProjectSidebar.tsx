"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { cn } from "@/lib/utils";
import { Activity, ListTodo, Share2, FileBarChart, ClipboardList, PlayCircle, Settings2, Box, Bot, Settings } from "lucide-react";

const ITEM_STYLE: Record<string, { iconColor: string; activeBg: string; activeText: string }> = {
  Dashboards:       { iconColor: "#4f46e5", activeBg: "#eef2ff", activeText: "#4338ca" },
  Repository:       { iconColor: "#7c3aed", activeBg: "#f5f3ff", activeText: "#6d28d9" },
  "Test Plans":     { iconColor: "#0891b2", activeBg: "#ecfeff", activeText: "#0e7490" },
  "Test Runs":      { iconColor: "#059669", activeBg: "#f0fdf4", activeText: "#047857" },
  Automation:       { iconColor: "#d97706", activeBg: "#fffbeb", activeText: "#b45309" },
  Settings:         { iconColor: "#64748b", activeBg: "#f1f5f9", activeText: "#475569" },
  Integrations:     { iconColor: "#e11d48", activeBg: "#fff1f2", activeText: "#be123c" },
  "Audit Logs":     { iconColor: "#0369a1", activeBg: "#f0f9ff", activeText: "#0284c7" },
  "Shared Steps":   { iconColor: "#0891b2", activeBg: "#ecfeff", activeText: "#0e7490" },
  Environments:     { iconColor: "#16a34a", activeBg: "#f0fdf4", activeText: "#15803d" },
};
const DEFAULT_S = { iconColor: "#64748b", activeBg: "#f1f5f9", activeText: "#475569" };

export function ProjectSidebar({ projectCode }: { projectCode: string }) {
  const pathname = usePathname();
  const { role, isSystemAdmin } = useProjectRole();

  const menuGroups = [
    {
      title: "Overview",
      items: [{ name: "Dashboards", href: `/projects/${projectCode}/dashboards`, icon: FileBarChart }],
    },
    {
      title: "Tests",
      items: [{ name: "Repository", href: `/projects/${projectCode}/repository`, icon: ListTodo }],
    },
    {
      title: "Execution",
      items: [
        { name: "Test Plans", href: `/projects/${projectCode}/plans`, icon: ClipboardList },
        { name: "Test Runs",  href: `/projects/${projectCode}/runs`,  icon: PlayCircle    },
      ],
    },
    {
      title: "AI",
      items: [{ name: "Automation", href: `/projects/${projectCode}/automation`, icon: Bot }],
    },
  ];

  function NavItem({ name, href, icon: Icon, isActiveCheck }: { name: string; href: string; icon: React.ElementType; isActiveCheck: boolean }) {
    const s = ITEM_STYLE[name] ?? DEFAULT_S;
    return (
      <li>
        <Link href={href}
          className={cn("flex items-center gap-3 px-2.5 h-9 rounded-xl text-sm font-medium transition-all", isActiveCheck ? "shadow-sm" : "hover:bg-slate-50")}
          style={isActiveCheck ? { background: s.activeBg } : {}}>
          <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ background: isActiveCheck ? `${s.iconColor}20` : `${s.iconColor}12` }}>
            <Icon size={13} style={{ color: s.iconColor, opacity: isActiveCheck ? 1 : 0.65 }} />
          </span>
          <span className="truncate font-semibold text-[13px]" style={{ color: isActiveCheck ? s.activeText : "#64748b" }}>
            {name}
          </span>
          {isActiveCheck && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.iconColor }} />}
        </Link>
      </li>
    );
  }

  return (
    <aside className="w-[220px] flex flex-col h-full overflow-y-auto shrink-0"
      style={{ background: "#fff", borderRight: "1px solid #e8eaf2" }}>

      {/* Project header */}
      <div className="h-12 flex items-center gap-2.5 px-4 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shadow-sm"
          style={{ background: "linear-gradient(135deg, #4f46e5, #a855f7)" }}>
          {projectCode.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm font-bold text-slate-700 truncate">{projectCode}</span>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-3 pb-4" style={{ borderTop: "1px solid #f1f3f9" }}>
        {menuGroups.map((group) => (
          <div key={group.title} className="pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 px-2 mb-1.5">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.name} name={item.name} href={item.href} icon={item.icon}
                  isActiveCheck={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
              ))}
            </ul>
          </div>
        ))}

        <div className="flex-1" />

        {/* Config section */}
        {(role === "ADMIN" || isSystemAdmin) && (
          <div className="pt-3 space-y-0.5" style={{ borderTop: "1px solid #f1f3f9" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 px-2 mb-1.5">Config</p>
            <NavItem name="Settings"     href={`/projects/${projectCode}/settings`}              icon={Settings}  isActiveCheck={pathname === `/projects/${projectCode}/settings`} />
            <NavItem name="Integrations" href={`/projects/${projectCode}/settings/integrations`} icon={Settings2} isActiveCheck={pathname.startsWith(`/projects/${projectCode}/settings/integrations`)} />
            <NavItem name="Audit Logs"   href={`/projects/${projectCode}/activity`}              icon={Activity}  isActiveCheck={pathname.startsWith(`/projects/${projectCode}/activity`)} />
          </div>
        )}
        <div className="pt-2 space-y-0.5">
          <NavItem name="Shared Steps" href={`/projects/${projectCode}/shared-steps`} icon={Share2} isActiveCheck={pathname.startsWith(`/projects/${projectCode}/shared-steps`)} />
          <NavItem name="Environments" href={`/projects/${projectCode}/environments`} icon={Box}    isActiveCheck={pathname.startsWith(`/projects/${projectCode}/environments`)} />
        </div>
      </div>
    </aside>
  );
}
