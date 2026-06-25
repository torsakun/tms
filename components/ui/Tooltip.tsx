"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  /** Delay before showing, ms. Default 300 — matches OS tooltip feel. */
  delay?: number;
}

/**
 * Portal + fixed-position tooltip. Escapes overflow/clip containers (sidebars,
 * scrollable lists) where a plain absolute tooltip would be cut off.
 */
export function Tooltip({ label, children, side = "top", delay = 300 }: TooltipProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = side === "top" ? rect.top : rect.bottom;
      timer.current = setTimeout(() => setCoords({ x, y }), delay);
    },
    [side, delay],
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCoords(null);
  }, []);

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={(e) => show(e as unknown as React.MouseEvent<HTMLSpanElement>)}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
      {coords &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              left: coords.x,
              top: side === "top" ? coords.y - 8 : coords.y + 8,
              transform: `translate(-50%, ${side === "top" ? "-100%" : "0"})`,
              zIndex: 300,
            }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-[var(--neutral-950)] px-2 py-1 text-[11px] font-medium text-white shadow-lg animate-fade-up"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
