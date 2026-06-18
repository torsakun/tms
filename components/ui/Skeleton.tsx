import { cn } from "@/lib/utils";

/** Single shimmer block. Compose into row/card skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} aria-hidden="true" />;
}

/** Table-shaped placeholder for list pages. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-surface overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      <div className="px-5 py-3 border-b border-border bg-surface-hover/80 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-24" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1" />
            {Array.from({ length: cols - 1 }).map((_, c) => (
              <Skeleton key={c} className="h-3 w-20 shrink-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
