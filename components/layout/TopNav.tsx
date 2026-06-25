"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, User, LogOut, AtSign } from "lucide-react";
import { CommandPalette } from "@/components/ui/CommandPalette";

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
    <header className="relative z-50 w-full shrink-0 bg-white">
      <div className="flex h-[52px] items-center justify-between px-[18px]">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-5">
          <Link href="/projects" className="group flex items-center gap-[9px]">
            <AtSign size={18} className="text-black" />
            <span className="text-[15px] font-bold tracking-[-0.01em] text-black">
              QMaster
            </span>
          </Link>

          <nav className="ml-[6px] flex items-center gap-0.5">
            {NAV_LINKS.map(({ name, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    "rounded-[8px] px-[11px] py-1.5 text-[14px] font-medium transition-colors duration-150",
                    isActive
                      ? "bg-[#dbeafe] text-black"
                      : "text-black hover:bg-[#f4f6f8]",
                  )}
                >
                  {name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme + Search + Bell + Avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="flex h-[34px] min-w-[220px] items-center gap-2 rounded-[9px] bg-white px-3 text-black"
            aria-label="Open command palette"
          >
            <Search size={18} />
            <span className="mr-auto hidden text-[13px] font-medium sm:inline">Search</span>
            <kbd className="hidden text-[11px] font-medium text-black sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-all"
            >
              <div
                className="flex h-[30px] w-[30px] select-none items-center justify-center rounded-full bg-[#dbeafe] text-[12px] font-bold text-black"
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
                className="absolute right-0 mt-3 w-72 qm-panel py-2 z-50 animate-fade-up"
              >
                <div className="px-5 py-4 border-b border-border bg-surface-hover/60 m-2 mt-0 rounded-xl">
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
                    className="flex items-center gap-3 px-4 py-2.5 rounded-[9px] text-[14px] font-semibold text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                  >
                    <User size={16} />
                    Profile settings
                  </Link>
                </div>
                <div className="py-1 px-2 border-t border-border/50 mt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[9px] text-[14px] font-semibold text-danger hover:bg-danger-soft transition-colors"
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
