import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Location trail. Last item is the current page (no link). */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={13} className="text-slate-300 shrink-0" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-text-muted hover:text-indigo-600 transition-colors shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-text-main font-medium truncate" : "text-text-muted shrink-0"}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
