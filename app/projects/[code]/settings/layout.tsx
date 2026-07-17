"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Settings,
  SlidersHorizontal,
  Users,
  Shield,
  Puzzle,
  Server,
  History,
  type LucideIcon,
} from "lucide-react";

const TABS: { label: string; icon: LucideIcon; href: (c: string) => string }[] = [
  { label: "General", icon: SlidersHorizontal, href: (c: string) => `/projects/${c}/settings/general` },
  { label: "Members", icon: Users, href: (c: string) => `/projects/${c}/settings/members` },
  { label: "Access control", icon: Shield, href: (c: string) => `/projects/${c}/settings/access-control` },
  { label: "Integrations", icon: Puzzle, href: (c: string) => `/projects/${c}/settings/integrations` },
  { label: "Environments", icon: Server, href: (c: string) => `/projects/${c}/settings/environments` },
  { label: "Activity log", icon: History, href: (c: string) => `/projects/${c}/activity` },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const code = params.code as string;

  return (
    <div className="w-full max-w-[980px] mx-auto antialiased font-sans pb-20">
      
      <div className="flex items-center gap-[10px] p-[16px_22px]">
        <Settings size={21} className="text-text-faint" />
        <span className="text-[18px] font-semibold tracking-[-0.01em] text-text-main">Project settings</span>
        <span className="text-[13px] text-text-faint">· {code}</span>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-0 min-h-[600px] border-t border-border">
        
        {/* settings nav */}
        <div className="border-r border-border p-[16px_12px] flex flex-col gap-[2px]">
          {TABS.map((tab) => {
            const href = tab.href(code);
            // Handle activity log differently since it's not strictly under /settings/
            const isActivity = tab.label === "Activity log";
            const active = isActivity ? pathname === href : (pathname === href || pathname.startsWith(href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={href}
                className={`flex items-center gap-[10px] p-[8px_11px] rounded-[9px] text-[13px] transition-colors ${
                  active
                    ? "bg-primary-soft text-primary-text font-semibold"
                    : "bg-transparent text-text-muted font-medium hover:bg-surface-hover hover:text-text-main"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* content */}
        <div className="p-[24px_28px]">
          {children}
        </div>

      </div>
    </div>
  );
}
