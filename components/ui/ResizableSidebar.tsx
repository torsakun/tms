"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ResizableSidebarProps {
  children: React.ReactNode;
  storageKey: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizableSidebar({
  children,
  storageKey,
  defaultWidth = 268,
  minWidth = 200,
  maxWidth = 480,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const isDragging = useRef(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(storageKey));
    if (stored >= minWidth && stored <= maxWidth) setWidth(stored);
  }, [storageKey, minWidth, maxWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const next = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      setWidth(next);
    },
    [minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setWidth((w) => {
      localStorage.setItem(storageKey, String(w));
      return w;
    });
  }, [storageKey]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="relative shrink-0" style={{ width }}>
      {children}
      <div
        onMouseDown={() => {
          isDragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="absolute top-0 right-0 h-full w-[5px] translate-x-1/2 cursor-col-resize z-10 group"
      >
        <div className="h-full w-[1px] mx-auto bg-transparent group-hover:bg-primary transition-colors" />
      </div>
    </div>
  );
}
