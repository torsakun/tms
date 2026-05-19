"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";

interface ResizableLayoutProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizableLayout({
  leftPane,
  rightPane,
  initialWidth = 288,
  minWidth = 200,
  maxWidth = 600,
}: ResizableLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      let newWidth = e.clientX;
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left Pane Container */}
      <aside 
        className="flex flex-col shrink-0 h-full bg-white relative"
        style={{ width: sidebarWidth }}
      >
        {leftPane}
        
        {/* Drag Handle */}
        <div 
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 z-10 transition-colors border-r border-slate-200"
          onMouseDown={handleMouseDown}
        />
      </aside>

      {/* Right Pane Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {rightPane}
      </div>
    </div>
  );
}
