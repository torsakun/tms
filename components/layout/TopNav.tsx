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
    <header className="w-full h-16 bg-slate-900 shadow-[0_1px_15px_rgba(0,0,0,0.04)] dark:shadow-none flex items-center justify-between px-6 shrink-0 transition-colors z-50 relative border-b border-slate-800">
      <div className="flex items-center space-x-8">
        {/* Logo Placeholder */}
        <Link href="/projects" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
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
        <button className="text-slate-400 hover:text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </button>
        
        <div className="relative">
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="w-8 h-8 bg-[#4338ca] rounded flex items-center justify-center text-white text-xs font-bold leading-none text-center cursor-pointer hover:bg-[#3730a3] transition-colors"
          >
            {getInitials(session?.user?.name || session?.user?.email)}
          </div>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800 truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Profile Settings
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
