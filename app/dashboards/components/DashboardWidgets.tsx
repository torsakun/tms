import Link from "next/link";
import type { ReactNode } from "react";

/* ── Card shell — one consistent container for every widget ── */
export function WidgetCard({
  title,
  hint,
  right,
  children,
  className = "",
  borderless = false,
  tinted = false,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  borderless?: boolean;
  tinted?: boolean;
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl transition-all duration-300 ${
        borderless
          ? tinted
            ? "bg-surface-hover/50 shadow-sm"
            : "bg-surface shadow-sm"
          : "border border-border/80 bg-surface shadow-premium hover:-translate-y-1 hover:border-border"
      } p-6 relative overflow-hidden group ${className}`}
    >
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-text-main truncate tracking-tight">{title}</h3>
          {hint && <p className="text-[12px] font-medium text-text-muted mt-1">{hint}</p>}
        </div>
        <div className="relative z-10">{right}</div>
      </div>
      <div className="flex-1 min-h-0 relative z-10">{children}</div>
    </section>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full py-6 text-[12px] text-text-muted">
      {label}
    </div>
  );
}

/* ── Ranked list — label + sub + a right value, optional progress bar ── */
export function RankList({
  items,
  empty,
}: {
  items: Array<{
    label: string;
    sub?: string;
    href?: string;
    value: string;
    valueColor?: string;
    bar?: number; // 0-100
    barColor?: string;
  }>;
  empty: string;
}) {
  if (items.length === 0) return <EmptyHint label={empty} />;
  return (
    <ul className="space-y-4">
      {items.map((it, i) => {
        const Row = (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] font-bold text-text-main truncate tracking-tight">
                {it.label}
              </span>
              <span
                className="text-[14px] font-extrabold shrink-0 tracking-tight"
                style={{ color: it.valueColor || "var(--text-main)" }}
              >
                {it.value}
              </span>
            </div>
            {it.sub && (
              <div className="text-[12px] font-medium text-text-muted truncate mt-0.5">{it.sub}</div>
            )}
            {typeof it.bar === "number" && (
              <div className="mt-2 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(2, Math.min(100, it.bar))}%`,
                    background: it.barColor || "var(--primary)",
                  }}
                />
              </div>
            )}
          </>
        );
        return (
          <li key={i}>
            {it.href ? (
              <Link href={it.href} className="block group transition-all duration-200">
                <div className="group-hover:translate-x-1 transition-transform duration-200">
                  {Row}
                </div>
              </Link>
            ) : (
              Row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ── Stacked segment bar (status / run-status distribution) ── */
export function SegmentBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <EmptyHint label="No data in this window" />;
  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-hover">
        {segments.map(
          (s, i) =>
            s.value > 0 && (
              <div
                key={i}
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                title={`${s.label}: ${s.value}`}
              />
            ),
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-text-muted">{s.label}</span>
            <span className="text-[11px] font-bold text-text-main">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KPI ribbon — pass-rate hero + supporting metrics, varied weight ── */
export function KpiRibbon({
  passRate,
  runs,
  activeRuns,
  automation,
  automatedCount,
  cases,
  projects,
  atRisk,
}: {
  passRate: number;
  runs: number;
  activeRuns: number;
  automation: number;
  automatedCount: number;
  cases: number;
  projects: number;
  atRisk: number;
}) {
  const isHealthy = passRate >= 90;
  const isWarning = passRate >= 70 && passRate < 90;
  
  const heroClasses = isHealthy 
    ? "bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-50"
    : isWarning 
      ? "bg-amber-50 text-amber-900 border-amber-200 shadow-amber-500/10 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-50"
      : "bg-rose-50 text-rose-900 border-rose-200 shadow-rose-500/10 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-50";

  const passColor = isHealthy ? "var(--emerald-600)" : isWarning ? "var(--amber-600)" : "var(--rose-600)";
  const passDarkColor = isHealthy ? "var(--emerald-400)" : isWarning ? "var(--amber-400)" : "var(--rose-400)";

  const Cell = ({
    label,
    value,
    sub,
    color,
  }: {
    label: string;
    value: string;
    sub: string;
    color?: string;
  }) => (
    <div className="flex flex-col justify-center px-8 py-6">
      <div className="text-[12px] font-bold text-text-muted mb-1">
        {label}
      </div>
      <div
        className="text-[32px] font-extrabold tracking-tighter leading-none"
        style={{ color: color || "var(--text-main)" }}
      >
        {value}
      </div>
      <div className="text-[13px] font-medium text-text-muted mt-2">{sub}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-2">
      {/* Massive Hero Block for Pass Rate */}
      <div className={`md:col-span-5 flex flex-col justify-between rounded-3xl border shadow-premium p-8 md:p-10 ${heroClasses}`}>
        <div>
          <div className="text-[14px] font-bold tracking-wide uppercase opacity-80 mb-2">
            Global Pass Rate
          </div>
          <div className="text-[clamp(4rem,8vw,6rem)] font-extrabold tracking-tighter leading-none">
            {passRate.toFixed(0)}%
          </div>
        </div>
        
        <div className="mt-12">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[14px] font-bold opacity-90">Health trend</span>
            <span className="text-[13px] font-medium opacity-75">{runs.toLocaleString()} runs</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ 
                width: `${passRate}%`, 
                backgroundColor: "currentColor" 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Supporting Metrics Bento */}
      <div className="md:col-span-7 grid grid-cols-2 rounded-3xl bg-surface border border-border/80 shadow-premium divide-x divide-y divide-border/80 overflow-hidden">
        <Cell label="Test runs" value={runs.toLocaleString()} sub={`${activeRuns} active in queue`} />
        <Cell label="Automation" value={`${automation.toFixed(0)}%`} sub={`${automatedCount.toLocaleString()} automated`} />
        <Cell label="Test cases" value={cases.toLocaleString()} sub={`${projects} projects tracked`} />
        <Cell
          label="At risk"
          value={atRisk.toLocaleString()}
          sub="failed or blocked"
          color={atRisk > 0 ? "var(--rose-500)" : "var(--emerald-500)"}
        />
      </div>
    </div>
  );
}
