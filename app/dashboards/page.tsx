import React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  ArrowUp,
  Bot,
  Bug,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Filter,
  PlayCircle,
  Rocket,
  ShieldAlert,
  TrendingDown,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const dynamic = "force-dynamic";

type ProjectRow = {
  rank: number;
  name: string;
  abbr: string;
  cases: number;
  suites: number;
  health: number;
  auto: number;
  activeRuns: number;
  totalRuns: number;
  lastActivity: string;
  fresh: boolean;
  trend: number[];
  iconBg: string;
  iconColor: string;
};

const spark = (values: number[]) => {
  const width = 78;
  const height = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index * (width / (values.length - 1))).toFixed(1);
      const y = (height - 2 - ((value - min) / spread) * (height - 4)).toFixed(1);
      return `${x},${y}`;
    })
    .join(" ");
};

const orgKpis = [
  { label: "Overall pass rate", value: "91.6%", icon: CheckCircle2, delta: "+1.2 pts", spark: [88, 89, 90, 90, 91, 91, 92], color: "var(--pass)" },
  { label: "Total projects", value: "8", icon: Workflow, delta: "+1", spark: [6, 6, 7, 7, 7, 8, 8], color: "var(--primary)" },
  { label: "Total runs", value: "1,284", icon: PlayCircle, delta: "+96", spark: [1050, 1100, 1140, 1180, 1210, 1250, 1284], color: "var(--primary)" },
  { label: "Org automation", value: "64%", icon: Bot, delta: "+6 pts", spark: [52, 55, 57, 59, 61, 62, 64], color: "var(--primary)" },
];

const projects: ProjectRow[] = [
  { rank: 1, name: "Auth Service", abbr: "AS", cases: 642, suites: 14, health: 97, auto: 84, activeRuns: 1, totalRuns: 96, lastActivity: "2 d ago", fresh: false, trend: [94, 95, 95, 96, 96, 97, 97], iconBg: "var(--pass-soft)", iconColor: "var(--pass)" },
  { rank: 2, name: "Checkout Web", abbr: "CW", cases: 2484, suites: 38, health: 94, auto: 72, activeRuns: 6, totalRuns: 318, lastActivity: "6 h ago", fresh: true, trend: [90, 91, 92, 92, 93, 94, 94], iconBg: "var(--primary-soft)", iconColor: "var(--primary-text)" },
  { rank: 3, name: "Search & Browse", abbr: "SB", cases: 531, suites: 11, health: 91, auto: 63, activeRuns: 0, totalRuns: 78, lastActivity: "3 d ago", fresh: false, trend: [88, 89, 90, 90, 91, 91, 91], iconBg: "var(--primary-soft)", iconColor: "var(--primary-text)" },
  { rank: 4, name: "Payments API", abbr: "PA", cases: 1203, suites: 22, health: 88, auto: 91, activeRuns: 3, totalRuns: 204, lastActivity: "1 d ago", fresh: true, trend: [84, 85, 86, 87, 87, 88, 88], iconBg: "var(--info-soft-fill)", iconColor: "var(--info)" },
  { rank: 5, name: "Notifications", abbr: "NT", cases: 388, suites: 9, health: 86, auto: 58, activeRuns: 1, totalRuns: 52, lastActivity: "5 h ago", fresh: true, trend: [83, 84, 84, 85, 86, 86, 86], iconBg: "var(--warn-soft)", iconColor: "var(--warn)" },
  { rank: 6, name: "Mobile Web", abbr: "MW", cases: 918, suites: 19, health: 73, auto: 46, activeRuns: 2, totalRuns: 142, lastActivity: "4 h ago", fresh: true, trend: [78, 76, 75, 74, 74, 73, 73], iconBg: "var(--warn-soft)", iconColor: "var(--warn)" },
  { rank: 7, name: "Admin Console", abbr: "AC", cases: 274, suites: 7, health: 69, auto: 38, activeRuns: 0, totalRuns: 34, lastActivity: "8 d ago", fresh: false, trend: [74, 73, 72, 71, 70, 69, 69], iconBg: "var(--info-soft-fill)", iconColor: "var(--info)" },
  { rank: 8, name: "Legacy Import", abbr: "LI", cases: 146, suites: 5, health: 61, auto: 22, activeRuns: 0, totalRuns: 18, lastActivity: "21 d ago", fresh: false, trend: [68, 66, 65, 64, 63, 62, 61], iconBg: "var(--pass-soft)", iconColor: "var(--pass)" },
];

const heat = projects.map((project, projectIndex) => ({
  name: project.name,
  cells: Array.from({ length: 30 }, (_, day) => {
    const rate = Math.min(100, Math.max(45, project.health - 6 + ((projectIndex * 5 + day * 7) % 16) - (day > 26 ? 5 : 0)));
    const tier = rate < 65 ? 0 : rate < 80 ? 1 : rate < 90 ? 2 : rate < 97 ? 3 : 4;
    return { rate, tier };
  }),
}));

const riskCards = [
  {
    title: "Top failing - across all projects",
    icon: TrendingDown,
    iconColor: "var(--fail)",
    badge: "org",
    badgeBg: "var(--fail-soft)",
    badgeColor: "var(--fail)",
    items: [
      { proj: "CW", title: "Apply promo code at checkout", metric: "62%", metricColor: "var(--fail)" },
      { proj: "MW", title: "Tap-to-pay sheet dismiss", metric: "64%", metricColor: "var(--fail)" },
      { proj: "CW", title: "Guest checkout - invalid card", metric: "68%", metricColor: "var(--fail)" },
      { proj: "PA", title: "Refund partial capture", metric: "71%", metricColor: "var(--warn)" },
    ],
  },
  {
    title: "Open defects - across all projects",
    icon: Bug,
    iconColor: "var(--warn)",
    badge: "42",
    badgeBg: "var(--warn-soft)",
    badgeColor: "var(--warn)",
    items: [
      { proj: "CW", title: "Promo stacking returns 422", metric: "P1", metricColor: "var(--fail)" },
      { proj: "PA", title: "Webhook retry storm on timeout", metric: "P1", metricColor: "var(--fail)" },
      { proj: "MW", title: "Keyboard covers CVV field", metric: "P2", metricColor: "var(--warn)" },
      { proj: "AC", title: "Role table pagination off-by-one", metric: "P3", metricColor: "var(--text-faint)" },
    ],
  },
];

const mywork = [
  { title: "Guest checkout - invalid card", proj: "Checkout Web", status: XCircle, statusColor: "var(--fail)", pri: "keyboard_double_arrow_up", priColor: "var(--fail)" },
  { title: "Webhook retry on timeout", proj: "Payments API", status: ShieldAlert, statusColor: "var(--warn)", pri: "keyboard_double_arrow_up", priColor: "var(--fail)" },
  { title: "Tap-to-pay sheet dismiss", proj: "Mobile Web", status: Circle, statusColor: "var(--skip)", pri: "drag_handle", priColor: "var(--warn)" },
  { title: "SSO session expiry banner", proj: "Auth Service", status: CheckCircle2, statusColor: "var(--pass)", pri: "keyboard_arrow_down", priColor: "var(--text-faint)" },
];

const activity = [
  { who: "Mara Alvarez", action: "completed a regression run", proj: "Checkout Web", when: "12 min ago", icon: CheckCircle2, bg: "var(--pass-soft)", color: "var(--pass)" },
  { who: "Ravi Kapoor", action: "raised a P1 defect", proj: "Payments API", when: "38 min ago", icon: Bug, bg: "var(--warn-soft)", color: "var(--warn)" },
  { who: "CI bot", action: "aborted a load-spike run", proj: "Mobile Web", when: "1 h ago", icon: XCircle, bg: "var(--fail-soft)", color: "var(--fail)" },
  { who: "Jordan Lee", action: "created a new project", proj: "Notifications", when: "3 h ago", icon: Workflow, bg: "var(--primary-soft)", color: "var(--primary-text)" },
  { who: "Lin Qiu", action: "published a test plan", proj: "Auth Service", when: "5 h ago", icon: CheckCircle2, bg: "var(--info-soft-fill)", color: "var(--info)" },
];

const schedules = [
  { name: "Nightly regression", proj: "Checkout Web", cron: "0 2 * * *", when: "in 6h", icon: CalendarDays },
  { name: "Hourly smoke", proj: "Payments API", cron: "0 * * * *", when: "in 24m", icon: Zap },
  { name: "Pre-deploy gate", proj: "Auth Service", cron: "on deploy", when: "pending", icon: Rocket },
  { name: "Weekly sweep", proj: "Mobile Web", cron: "0 3 * * 1", when: "Mon", icon: CalendarDays },
];

function healthTone(health: number) {
  if (health >= 90) return ["var(--pass-soft)", "var(--pass)"];
  if (health >= 75) return ["var(--warn-soft)", "var(--warn)"];
  return ["var(--fail-soft)", "var(--fail)"];
}

function projectBadgeColor(project: string) {
  const map: Record<string, [string, string]> = {
    CW: ["var(--primary-soft)", "var(--primary-text)"],
    PA: ["var(--info-soft-fill)", "var(--info)"],
    MW: ["var(--warn-soft)", "var(--warn)"],
    AS: ["var(--pass-soft)", "var(--pass)"],
    AC: ["var(--surface-2)", "var(--text-muted)"],
  };
  return map[project] || map.AC;
}

export default function GlobalDashboardPage() {
  return (
    <div
      className={`${inter.className} flex min-h-0 flex-1 flex-col bg-white text-[14px] leading-[1.45] text-black`}
      style={{
        background: "#fff",
        ["--bg" as string]: "var(--bg-background)",
        ["--surface" as string]: "var(--bg-surface)",
        ["--surface-2" as string]: "var(--bg-surface-hover)",
        ["--border" as string]: "var(--border-color)",
        ["--text" as string]: "var(--text-main)",
        ["--pass" as string]: "var(--success)",
        ["--pass-soft" as string]: "var(--success-soft)",
        ["--fail" as string]: "var(--danger)",
        ["--fail-soft" as string]: "var(--danger-soft)",
        ["--warn" as string]: "var(--warning)",
        ["--warn-soft" as string]: "var(--warning-soft)",
        ["--info-soft-fill" as string]: "var(--info-soft)",
      }}
    >
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[1320px] p-5">
          <header className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-[11px]">
                <h1 className="text-[21px] font-semibold tracking-[-0.015em]">QA Overview</h1>
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-text-muted">Portfolio</span>
              </div>
              <p className="mt-[3px] text-[13px] text-text-muted">Quality across all 8 projects · last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-3 text-[13px] font-medium text-black">
                <Filter size={17} className="text-text-faint" />
                All projects
                <ChevronDown size={18} className="text-text-faint" />
              </button>
              <button className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-border bg-surface px-3 text-[13px] font-medium text-black">
                <CalendarDays size={17} className="text-text-faint" />
                30 days
                <ChevronDown size={18} className="text-text-faint" />
              </button>
            </div>
          </header>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
            {orgKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label}>
                  <div className="flex items-center gap-[7px] text-[12.5px] font-medium text-text-muted">
                    <Icon size={16} className="text-text-faint" />
                    {kpi.label}
                  </div>
                  <div className="mt-[9px] flex items-end justify-between">
                    <div className="text-[27px] font-semibold tracking-[-0.02em] tabular-nums">{kpi.value}</div>
                  </div>
                  <div className="mt-[6px] flex items-center gap-1 text-[12px] font-semibold text-black">
                    <ArrowUp size={15} />
                    {kpi.delta}
                    <span className="font-normal text-text-faint">vs prev</span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mb-[14px]">
            <div className="mb-[14px] flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Projects, ranked by health</h2>
              <span className="text-[12px] text-text-faint">click a project to open its overview</span>
            </div>
            <div className="grid grid-cols-[24px_1.9fr_96px_150px_110px_130px_96px_28px] gap-3 px-[18px] py-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-text-faint max-lg:hidden">
              <div>#</div><div>Project</div><div>Health</div><div>Automation</div><div>Runs</div><div>Last activity</div><div>Trend</div><div />
            </div>
            {projects.map((project) => {
              return (
                <Link
                  key={project.abbr}
                  href="/projects/PRO/dashboards"
                  className="grid grid-cols-[24px_1.9fr_96px_150px_110px_130px_96px_28px] items-center gap-3 px-[18px] py-3 max-lg:grid-cols-[36px_1fr_auto] max-lg:gap-x-3"
                  style={{ background: "transparent" }}
                >
                  <div className="text-[12px] font-bold tabular-nums text-black">{project.rank}</div>
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] text-[12px] font-bold" style={project.rank === 2 || project.rank === 3 ? { background: "#dbeafe", color: "black" } : { color: "black" }}>{project.abbr}</div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{project.name}</div>
                      <div className="text-[10.5px] text-text-faint">{project.cases} cases · {project.suites} suites</div>
                    </div>
                  </div>
                  <div><span className="text-[12px] font-bold tabular-nums text-black">{project.health}%</span></div>
                  <div className="text-[12px] font-bold tabular-nums text-black max-lg:hidden">{project.auto}%</div>
                  <div className="text-[12.5px] tabular-nums text-black max-lg:hidden"><span className="font-bold">{project.activeRuns}</span><span> / {project.totalRuns}</span></div>
                  <div className="text-[11.5px] text-text-muted max-lg:hidden">{project.lastActivity}</div>
                  <div className="max-lg:hidden" />
                  <ChevronRight size={18} className="justify-self-end text-black max-lg:hidden" />
                </Link>
              );
            })}
          </section>

          <section className="mb-[14px]">
            <div className="mb-[14px] flex items-center justify-between gap-4">
              <h2 className="text-[14px] font-semibold">Quality grid <span className="text-[12.5px] font-normal text-text-faint">· daily pass rate per project · 30d</span></h2>
              <div className="flex items-center gap-1.5 text-[11px] text-text-faint">low<span>high</span></div>
            </div>
            <div className="flex flex-col gap-1.5">
              {heat.map((row) => (
                <div key={row.name} className="flex items-center gap-2.5">
                  <div className="w-24 shrink-0 truncate text-right text-[12px] text-text-muted">{row.name}</div>
                  <div className="flex flex-1 gap-[3px] opacity-0">{row.cells.map((cell, index) => <div key={index} title={`${cell.rate}% pass`} className="h-4 flex-1 rounded-[3px]" style={{ background: `var(--heat-${cell.tier})` }} />)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-[14px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
            {riskCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon size={17} className="text-text-muted" />
                    <h2 className="text-[14px] font-semibold">{card.title}</h2>
                    <span className="ml-auto text-[11px] font-bold text-black">{card.badge}</span>
                  </div>
                  {card.items.map((item) => {
                    const [bg, color] = projectBadgeColor(item.proj);
                    return <div key={item.title} className="flex items-center gap-1.5 py-[10px]"><span className="shrink-0 rounded-md px-[7px] py-px text-[10px] font-bold" style={{ background: item.proj === "CW" ? bg : "transparent", color: item.proj === "CW" ? color : "black" }}>{item.proj}</span><span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-black">{item.title}</span><span className="text-[12px] font-bold tabular-nums text-black">{item.metric}</span></div>;
                  })}
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-[14px] xl:grid-cols-3">
            <div>
              <div className="mb-[13px] flex items-center justify-between"><h2 className="text-[14px] font-semibold">My work <span className="text-[12px] font-normal text-text-faint">· all projects</span></h2><span className="rounded-full bg-[#dbeafe] px-2 py-px text-[11px] font-bold text-black">{mywork.length}</span></div>
              {mywork.map((work) => { const Status = work.status; return <div key={work.title} className="flex items-center gap-2.5 py-2.5"><Status size={17} className="text-black" /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-black">{work.title}</div><div className="text-[10.5px] text-text-faint">{work.proj}</div></div><span className="text-[11px] font-bold text-black">{work.pri === "keyboard_double_arrow_up" ? "⌃" : work.pri === "drag_handle" ? "=" : "⌄"}</span></div>; })}
            </div>

            <div>
              <h2 className="mb-[13px] text-[14px] font-semibold">Org activity</h2>
              {activity.map((entry) => { const Icon = entry.icon; return <div key={entry.who + entry.when} className="flex gap-[11px] pb-[14px]"><div className="flex shrink-0 flex-col items-center"><div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-transparent text-black"><Icon size={14} /></div></div><div className="min-w-0"><div className="truncate text-[12px] text-text-faint"><span className="font-semibold">{entry.who}</span> <span>{entry.action}</span></div><div className="mt-1 text-[10.5px] text-text-faint">{entry.proj} · {entry.when}</div></div></div>; })}
            </div>

            <div>
              <h2 className="mb-[13px] text-[14px] font-semibold">Upcoming schedules <span className="text-[12px] font-normal text-text-faint">· all projects</span></h2>
              <div className="flex flex-col gap-3">
                {schedules.map((schedule) => { const Icon = schedule.icon; return <div key={schedule.name} className="flex items-center gap-2.5"><div className="grid h-[30px] w-[30px] shrink-0 place-items-center"><Icon size={17} className="text-text-muted" /></div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-black">{schedule.name}</div><div className="truncate text-[10.5px] text-text-faint">{schedule.proj} · <span className="font-mono">{schedule.cron}</span></div></div><span className="text-[11px] font-bold text-black">{schedule.when}</span></div>; })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
