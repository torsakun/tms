import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  Edit2,
  PlayCircle,
  Calendar,
  FileText,
  CheckSquare,
  Clock,
} from "lucide-react";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Completed", cls: "bg-green-50 text-green-600" },
  ABORTED: { label: "Aborted", cls: "bg-red-50 text-red-500" },
  DRAFT: { label: "Draft", cls: "bg-surface-hover text-text-muted" },
};

export default async function TestPlanDetailPage({
  params,
}: {
  params: Promise<{ code: string; planId: string }>;
}) {
  const { code, planId } = await params;

  const plan = await prisma.testPlan.findUnique({
    where: { id: planId },
    include: {
      testCases: {
        include: { tags: true, suite: { select: { id: true, title: true } } },
        orderBy: { sequenceNumber: "asc" },
      },
      testRuns: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: { select: { results: true } },
        },
      },
      project: { select: { code: true, name: true } },
    },
  });

  if (!plan) notFound();

  // Group test cases by suite
  const bySuite = new Map<
    string,
    { title: string; cases: typeof plan.testCases }
  >();
  for (const tc of plan.testCases) {
    const key = tc.suite?.id ?? "__none__";
    const label = tc.suite?.title ?? "No Suite";
    if (!bySuite.has(key)) bySuite.set(key, { title: label, cases: [] });
    bySuite.get(key)!.cases.push(tc);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <Breadcrumb
              items={[
                { label: code, href: `/projects/${code}/repository` },
                { label: "Test Plans", href: `/projects/${code}/plans` },
                { label: plan.title },
              ]}
            />
          </div>
          <h1 className="text-2xl font-bold text-text-main leading-tight">
            {plan.title}
          </h1>
          {plan.description && (
            <p className="mt-2 text-text-muted text-[15px]">
              {plan.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> Created{" "}
              {new Date(plan.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckSquare size={13} /> {plan.testCases.length} test case
              {plan.testCases.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <PlayCircle size={13} /> {plan.testRuns.length} run
              {plan.testRuns.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/projects/${code}/plans/${planId}/edit`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-text-muted bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors shadow-sm"
          >
            <Edit2 size={14} /> Edit
          </Link>
          <Link
            href={`/projects/${code}/runs/create?plan=${planId}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:brightness-110 transition-all"
            style={{ background: "var(--primary)" }}
          >
            <PlayCircle size={14} /> Start run
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Test Cases (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Test Cases
          </h2>

          {plan.testCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-xl border border-border text-center">
              <FileText size={32} className="text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-text-muted">
                No test cases in this plan
              </p>
              <Link
                href={`/projects/${code}/plans/${planId}/edit`}
                className="mt-3 text-sm text-indigo-500 hover:underline font-medium"
              >
                Add test cases
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(bySuite.entries()).map(([key, group]) => (
                <div
                  key={key}
                  className="bg-surface rounded-xl border border-border overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-surface-hover border-b border-border flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {group.title}
                    </span>
                    <span className="text-xs text-text-muted font-medium">
                      {group.cases.length}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {group.cases.map((tc) => (
                      <div
                        key={tc.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
                          {code}-{tc.sequenceNumber || tc.id.substring(0, 4)}
                        </span>
                        <span className="text-[14px] text-text-main flex-1 truncate">
                          {tc.title}
                        </span>
                        {tc.tags.length > 0 && (
                          <div className="flex gap-1 shrink-0">
                            {tc.tags.slice(0, 2).map((t: any) => (
                              <span
                                key={t.id}
                                className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-surface-hover text-text-muted"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            tc.priority === "HIGH"
                              ? "bg-red-50 text-red-500"
                              : tc.priority === "MEDIUM"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-surface-hover text-text-muted"
                          }`}
                        >
                          {tc.priority ?? "LOW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Runs (1/3) ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Recent Runs
          </h2>

          {plan.testRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-surface rounded-xl border border-border text-center">
              <Clock size={28} className="text-slate-200 mb-2" />
              <p className="text-sm text-text-muted">No runs yet</p>
              <Link
                href={`/projects/${code}/runs/create?plan=${planId}`}
                className="mt-2 text-sm text-indigo-500 hover:underline font-medium"
              >
                Start first run
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {plan.testRuns.map((run) => {
                const s = STATUS_STYLE[run.status] ?? STATUS_STYLE["DRAFT"];
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${code}/runs/${run.id}`}
                    className="block bg-surface rounded-xl border border-border px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-text-main line-clamp-1 flex-1">
                        {run.title}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-text-muted">
                      <span>{run._count.results} cases</span>
                      <span>
                        {new Date(run.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
