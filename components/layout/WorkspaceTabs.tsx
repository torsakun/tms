"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Settings, Building2 } from "lucide-react";

export function WorkspaceTabs() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const primaryTabs: Array<{ name: string; href: string; exact?: boolean }> = [
    { name: "Users", href: "/workspace", exact: true },
    { name: "Invites", href: "/workspace/invites" },
    { name: "Groups", href: "/workspace/groups" },
    { name: "Roles", href: "/workspace/roles" },
  ];

  const configItems: Array<{ name: string; href: string; exact?: boolean }> = [
    { name: "Fields", href: "/workspace/fields" },
    { name: "Deployments", href: "/workspace/deployments" },
    { name: "Settings", href: "/workspace/settings" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const configActive = configItems.some((c) => isActive(c.href, c.exact));

  return (
    <div className="shrink-0 bg-surface border-b border-border z-40 relative px-[22px] pt-[18px]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col">
        {/* Workspace Header */}
        <div className="flex items-center gap-[10px] mb-[14px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-primary-light text-primary-text">
            <Building2 size={18} />
          </div>
          <div className="text-[18px] font-semibold tracking-[-0.01em] text-text-main">
            Workspace
          </div>
          {/* You can replace this with actual workspace name from context/session if available */}
          <span className="text-[13px] text-text-faint">· QMaster Org</span>
        </div>

        {/* Tabs Row */}
        <div className="flex gap-[2px]">
          <nav className="flex gap-[2px] flex-1 min-w-0 overflow-x-auto">
            {primaryTabs.map((t) => {
              const active = isActive(t.href, t.exact);
              return (
                <Link
                  key={t.name}
                  href={t.href}
                  className={cn(
                    "px-[12px] pt-[10px] pb-[9px] text-[13px] whitespace-nowrap transition-colors mb-[-1px]",
                    active
                      ? "font-semibold text-primary-text border-b-2 border-primary"
                      : "font-medium text-text-muted hover:text-text-main border-b-2 border-transparent",
                  )}
                >
                  {t.name}
                </Link>
              );
            })}
          </nav>

          {/* Configuration overflow dropdown */}
          <div className="relative shrink-0 flex" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className={cn(
                "flex items-center gap-[5px] px-[12px] pt-[10px] pb-[9px] text-[13px] transition-colors mb-[-1px]",
                configActive || dropdownOpen
                  ? "font-semibold text-primary-text border-b-2 border-primary"
                  : "font-medium text-text-faint hover:text-text-main border-b-2 border-transparent",
              )}
            >
              <Settings size={17} className={cn(!configActive && !dropdownOpen && "text-text-faint")} />
              <span>Configuration</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-[100%] mt-1 w-48 qm-panel z-50 py-1 overflow-hidden animate-fade-up">
                {configItems.map((c) => {
                  const active = isActive(c.href, c.exact);
                  return (
                    <Link
                      key={c.name}
                      href={c.href}
                      onClick={() => setDropdownOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-primary-light text-primary-text font-semibold"
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
        </div>
      </div>
    </div>
  );
}
