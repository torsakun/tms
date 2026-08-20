"use client";

import { useEffect, useState } from "react";

type Item = { level: number; label: string; id: string };

/** Sticky table of contents that highlights whichever section is on screen. */
export function DocsToc({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    // Bias the viewport upward so a heading counts as "current" once it reaches
    // the top area rather than only when it is centred.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-70px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-[64px] hidden h-fit w-[220px] shrink-0 lg:block">
      <div className="mb-[10px] text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
        On this page
      </div>
      <ul className="space-y-[1px] border-l border-border">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block border-l-[2px] py-[5px] text-[13px] leading-[1.4] transition-colors ${
                  item.level === 3 ? "pl-[22px]" : "pl-[12px]"
                } ${
                  active
                    ? "-ml-px border-primary font-semibold text-primary"
                    : "-ml-px border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
