"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Zap } from "lucide-react";

const NAV_LINKS = [
  { name: "Projects",   href: "/projects"   },
  { name: "Workspace",  href: "/workspace"  },
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

  const AVATAR_COLORS = ["#4f46e5","#7c3aed","#0891b2","#059669","#d97706","#e11d48","#0284c7","#9333ea"];

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    // If it looks like an email, use the part before @
    const display = name.includes("@") ? name.split("@")[0] : name;
    const p = display.split(" ").filter(Boolean);
    return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : display.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name?: string | null) => {
    if (!name) return AVATAR_COLORS[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  };

  return (
    <header className="w-full bg-white shrink-0 z-50 relative"
      style={{ borderBottom: "1px solid #e8eaf2", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>

      {/* Rainbow gradient accent bar */}
      <div className="topnav-accent w-full" />

      <div className="flex items-center justify-between px-5 h-13" style={{ height: "52px" }}>

        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/projects" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)" }}>
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              QMaster
            </span>
          </Link>

          <div className="w-px h-5" style={{ background: "#e4e7f0" }} />

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ name, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link key={name} href={href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}>
                  {name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-2">
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-white"
              style={{ background: "#f43f5e" }} />
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setDropdownOpen(!dropdownOpen); }}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-all">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm select-none"
                style={{ background: getAvatarColor(session?.user?.name || session?.user?.email) }}>
                {getInitials(session?.user?.name || session?.user?.email)}
              </div>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl py-1 z-50 animate-fade-up"
                style={{ border: "1px solid #e8eaf2", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f3f9" }}>
                  <p className="text-sm font-semibold text-slate-800 truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{session?.user?.email}</p>
                </div>
                <div className="py-1">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                    Profile settings
                  </Link>
                </div>
                <div className="py-1" style={{ borderTop: "1px solid #f1f3f9" }}>
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
