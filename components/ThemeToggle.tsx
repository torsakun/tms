"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    return <div className="h-10" />; // Placeholder
  }

  return (
    <div 
      className={cn(
        "flex items-center bg-surface-hover border border-border p-1 rounded-lg relative cursor-pointer mx-auto transition-colors shadow-sm",
        isCollapsed ? "w-10 justify-center" : "w-[100px]"
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!isCollapsed && (
        <>
          {/* Active indicator bubble */}
          <div 
            className={cn(
              "absolute w-[calc(50%-4px)] h-[calc(100%-8px)] top-1 bg-surface border border-border/50 rounded-md shadow-sm transition-all duration-300 z-0",
              isDark ? "left-[calc(50%)]" : "left-1"
            )}
          />
          
          <div className="flex-1 flex justify-center items-center py-1 z-10">
            <Sun size={14} className={cn("transition-colors", !isDark ? "text-text-main" : "text-text-muted")} />
          </div>
          <div className="flex-1 flex justify-center items-center py-1 z-10">
            <Moon size={14} className={cn("transition-colors", isDark ? "text-text-main" : "text-text-muted")} />
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex justify-center items-center p-1">
          {isDark ? <Moon size={16} className="text-white" /> : <Sun size={16} className="text-primary" />}
        </div>
      )}
    </div>
  );
}
