"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";


export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const navLinks = [
    { name: "Projects", href: "/projects" },
    { name: "Workspace", href: "/workspace" },
    { name: "Dashboards", href: "/dashboards" },
  ];

  return (
    <header className="w-full h-16 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-between px-6 shrink-0 transition-colors z-50 relative border-b border-white/10 text-white shadow-xl shadow-indigo-900/20">
      <div className="flex items-center space-x-6">
        {/* Logo Placeholder */}
        <Link href="/projects" className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-white/20">
          M
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-white/20 text-white font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-md border border-white/20"
                    : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        <button className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </button>
        
        <div className="relative">
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none text-center cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all hover:scale-105 border border-white/20"
          >
            {getInitials(session?.user?.name || session?.user?.email)}
          </div>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border z-50 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-hover/30">
                <p className="text-sm font-medium text-text-main truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-text-muted truncate">{session?.user?.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-text-main hover:bg-surface-hover transition-colors"
                >
                  Profile Settings
                </Link>
              </div>
              <div className="border-t border-border py-1">
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
