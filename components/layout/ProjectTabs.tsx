"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useProjectRole } from "@/components/providers/ProjectRoleProvider";
import { Settings, ChevronDown } from "lucide-react";

export function ProjectTabs({ projectCode }: { projectCode: string }) {
  const pathname = usePathname();
  const { role, isSystemAdmin } = useProjectRole();
  const [configOpen, setConfigOpen] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const base = `/projects/${projectCode}`;
  const tabs = [
    { name: "Dashboards", href: `${base}/dashboards`, match: "/dashboards" },
    { name: "Repository", href: `${base}/repository`, match: "/repository" },
    { name: "Test Plans", href: `${base}/plans`, match: "/plans" },
    { name: "Test Runs", href: `${base}/runs`, match: "/runs" },
    { name: "Automation", href: `${base}/automation`, match: "/automation" },
  ];

  const configItems = [
    { name: "Settings", href: `${base}/settings`, match: `${base}/settings` },
    { name: "Integrations", href: `${base}/settings/integrations` },
    { name: "Audit Logs", href: `${base}/activity` },
    { name: "Shared Steps", href: `${base}/shared-steps` },
    { name: "Environments", href: `${base}/environments` },
  ];

  const isActive = (match: string) =>
    pathname === `${base}${match}` || pathname.startsWith(`${base}${match}/`);

  const configActive = configItems.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
  );

  return (
    <div className="shrink-0 bg-surface border-b border-border">
      <div className="flex items-center gap-1 h-12 px-4">
        {/* Project identity */}
        <div className="flex items-center gap-2 pr-3 mr-1 shrink-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold"
            style={{ background: "var(--primary)" }}
          >
            {projectCode.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-text-main tracking-tight">
            {projectCode}
          </span>
          <span className="w-px h-5 bg-border ml-1" />
        </div>

        {/* Primary tabs */}
        <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
          {tabs.map((t) => {
            const active = isActive(t.match);
            return (
              <Link
                key={t.name}
                href={t.href}
                className={cn(
                  "relative px-3 h-12 inline-flex items-center text-[13px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "text-indigo-600"
                    : "text-text-muted hover:text-text-main",
                )}
              >
                {t.name}
                {active && (
                  <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Config overflow */}
        {(role === "ADMIN" || isSystemAdmin) && (
          <div className="relative shrink-0" ref={configRef}>
            <button
              onClick={() => setConfigOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-semibold border transition-colors",
                configActive || configOpen
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                  : "bg-surface text-text-muted border-border hover:text-text-main hover:bg-surface-hover",
              )}
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Manage</span>
              <ChevronDown size={13} />
            </button>

            {configOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fade-up">
                {configItems.map((c) => {
                  const active =
                    pathname === c.href || pathname.startsWith(`${c.href}/`);
                  return (
                    <Link
                      key={c.name}
                      href={c.href}
                      onClick={() => setConfigOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-text-main hover:bg-surface-hover",
                      )}
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
