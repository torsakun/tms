"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Zap, Search, User, LogOut } from "lucide-react";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "Workspace", href: "/workspace" },
  { name: "Dashboards", href: "/dashboards" },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const AVATAR_COLORS = [
    "#4f46e5",
    "#7c3aed",
    "#0891b2",
    "#059669",
    "#d97706",
    "#e11d48",
    "#0284c7",
    "#9333ea",
  ];

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    // If it looks like an email, use the part before @
    const display = name.includes("@") ? name.split("@")[0] : name;
    const p = display.split(" ").filter(Boolean);
    return p.length >= 2
      ? `${p[0][0]}${p[1][0]}`.toUpperCase()
      : display.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name?: string | null) => {
    if (!name) return AVATAR_COLORS[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  };

  return (
    <header
      className="w-full bg-surface shrink-0 z-50 relative border-b border-border/60 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/projects" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform group-hover:scale-105">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="font-black text-[18px] tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              QMaster
            </span>
          </Link>

          <div className="w-px h-5" style={{ background: "var(--border-color)" }} />

          <nav className="flex items-center gap-2">
            {NAV_LINKS.map(({ name, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200",
                    isActive
                      ? "text-indigo-700 bg-indigo-100/80 dark:text-indigo-300 dark:bg-indigo-500/20 shadow-sm"
                      : "text-text-muted hover:text-text-main hover:bg-surface-hover",
                  )}
                >
                  {name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme + Search + Bell + Avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-text-muted bg-surface-hover/80 hover:bg-surface-hover hover:text-text-main transition-all border border-border/50 hover:border-border hover:shadow-sm"
            aria-label="Open command palette"
          >
            <Search size={15} className="opacity-70" />
            <span className="text-[13px] font-semibold hidden sm:inline mr-2">Search</span>
            <kbd className="text-[10px] font-bold bg-background border border-border rounded-md px-1.5 py-0.5 shadow-sm hidden sm:inline text-text-muted">
              ⌘K
            </kbd>
          </button>

          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-hover transition-all">
            <Bell size={18} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-surface bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
            />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-2 px-1.5 py-1.5 rounded-xl hover:bg-surface-hover transition-all"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-black shadow-sm select-none"
                style={{
                  background: getAvatarColor(
                    session?.user?.name || session?.user?.email,
                  ),
                }}
              >
                {getInitials(session?.user?.name || session?.user?.email)}
              </div>
              <ChevronDown size={12} className="text-text-muted" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-3 w-72 bg-surface rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 border border-border/60 shadow-xl shadow-black/5 dark:shadow-black/20"
              >
                <div className="px-5 py-4 border-b border-border/50 bg-surface-hover/30 m-2 mt-0 rounded-xl">
                  <p className="text-[15px] font-extrabold text-text-main truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-[13px] font-medium text-text-muted truncate mt-0.5">
                    {session?.user?.email}
                  </p>
                </div>
                <div className="py-1 px-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-bold text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                  >
                    <User size={16} />
                    Profile settings
                  </Link>
                </div>
                <div className="py-1 px-2 border-t border-border/50 mt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <CommandPalette />
    </header>
  );
}
