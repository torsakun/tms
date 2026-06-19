"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Settings, ChevronDown, Building2 } from "lucide-react";

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
    <div className="shrink-0 bg-surface border-b border-border z-40 relative">
      <div className="flex items-center gap-1 h-12 px-4 w-full">
        {/* Workspace identity */}
        <div className="flex items-center gap-2 pr-3 mr-1 shrink-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold"
            style={{ background: "var(--primary)" }}
          >
            <Building2 size={12} />
          </div>
          <span className="text-sm font-bold text-text-main tracking-tight">
            Workspace
          </span>
          <span className="w-px h-5 bg-border ml-1" />
        </div>

        {/* Primary tabs */}
        <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
          {primaryTabs.map((t) => {
            const active = isActive(t.href, t.exact);
            return (
              <Link
                key={t.name}
                href={t.href}
                className={cn(
                  "relative px-3 h-12 inline-flex items-center text-[13px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "text-indigo-600 font-bold"
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

        {/* Configuration overflow dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-semibold border transition-colors",
              configActive || dropdownOpen
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "bg-surface text-text-muted border-border hover:text-text-main hover:bg-surface-hover",
            )}
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Configuration</span>
            <ChevronDown size={13} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fade-up">
              {configItems.map((c) => {
                const active = isActive(c.href, c.exact);
                return (
                  <Link
                    key={c.name}
                    href={c.href}
                    onClick={() => setDropdownOpen(false)}
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
      </div>
    </div>
  );
}

