import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  BadgeCheck,
  FileText,
  PlayCircle,
  CalendarDays,
  Pencil,
  Trash2,
  Play,
  ChevronsUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";

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
          results: {
            select: { status: true },
          },
        },
      },
      project: { select: { code: true, name: true } },
    },
  });

  if (!plan) notFound();

  const getPriIcon = (pri: string | null) => {
    switch (pri?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return { Icon: ChevronsUp, color: "var(--danger)" };
      case "LOW":
      case "TRIVIAL":
        return { Icon: ChevronDown, color: "var(--text-faint)" };
      default:
        return { Icon: Minus, color: "var(--warning)" };
    }
  };

  return (
    <div className="w-full bg-background text-text-main font-sans text-[14px] leading-snug antialiased min-h-0 overflow-y-auto flex-1">
      <div className="p-[18px_22px] max-w-[1120px] mx-auto">
        {/* breadcrumb */}
        <div className="flex items-center gap-[7px] text-[12.5px] text-text-faint mb-[14px]">
          <Link
            href={`/projects/${code}/plans`}
            className="hover:text-text-main transition-colors"
          >
            Test plans
          </Link>
          <ChevronRight size={15} />
          <span className="text-text-muted font-medium">{plan.title}</span>
        </div>

        {/* plan header */}
        <div className="flex items-start gap-[16px] bg-surface border border-border rounded-[13px] p-[18px_20px] shadow-sm mb-[18px]">
          <div className="w-[46px] h-[46px] rounded-[12px] bg-primary-light text-primary flex items-center justify-center shrink-0">
            <BadgeCheck size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-semibold tracking-[-0.015em]">
              {plan.title}
            </div>
            <div className="text-[13px] text-text-muted mt-[3px] leading-[1.5] max-w-[560px]">
              {plan.description || "No description provided."}
            </div>
            <div className="flex flex-wrap gap-[20px] mt-[12px]">
              <div className="flex items-center gap-[6px] text-[12.5px] text-text-muted">
                <FileText size={16} className="text-text-faint" />
                <span className="font-bold text-text-main">
                  {plan.testCases.length}
                </span>{" "}
                cases
              </div>
              <div className="flex items-center gap-[6px] text-[12.5px] text-text-muted">
                <PlayCircle size={16} className="text-text-faint" />
                <span className="font-bold text-text-main">
                  {plan.testRuns.length}
                </span>{" "}
                runs created
              </div>
              <div className="flex items-center gap-[6px] text-[12.5px] text-text-muted">
                <CalendarDays size={16} className="text-text-faint" />
                Created{" "}
                {new Date(plan.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-[8px] shrink-0">
            <Link
              href={`/projects/${code}/plans/${planId}/edit`}
              className="w-[36px] h-[36px] rounded-[9px] shadow-[inset_0_0_0_1px_var(--border-color)] flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
              title="Edit"
            >
              <Pencil size={18} />
            </Link>
            <button
              className="w-[36px] h-[36px] rounded-[9px] shadow-[inset_0_0_0_1px_var(--border-color)] flex items-center justify-center text-danger hover:bg-danger-soft transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <ButtonLink
              href={`/projects/${code}/runs/create?plan=${planId}`}
              variant="primary"
              size="md"
            >
              <Play size={18} />
              Start run from this plan
            </ButtonLink>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[16px]">
          {/* included cases */}
          <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between p-[14px_16px] border-b border-border">
              <div className="font-semibold text-[14px]">
                Included cases{" "}
                <span className="text-text-faint font-normal">
                  · {plan.testCases.length}
                </span>
              </div>
              <Link
                href={`/projects/${code}/plans/${planId}/edit`}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                Manage
              </Link>
            </div>

            {plan.testCases.length > 0 ? (
              <>
                <div className="grid grid-cols-[24px_1fr_100px_80px] gap-[10px] p-[8px_16px] text-[10.5px] font-semibold tracking-[0.05em] uppercase text-text-faint border-b border-border">
                  <div></div>
                  <div>Case</div>
                  <div>Suite</div>
                  <div>Priority</div>
                </div>
                <div className="overflow-y-auto">
                  {plan.testCases.map((c) => {
                    const { Icon, color } = getPriIcon(c.priority);
                    return (
                      <div
                        key={c.id}
                        className="grid grid-cols-[24px_1fr_100px_80px] gap-[10px] p-[11px_16px] items-center border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                      >
                        <Icon size={16} style={{ color }} />
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            {c.title}
                          </div>
                          <div className="font-mono text-[10px] text-text-faint">
                            {code}-
                            {c.sequenceNumber ||
                              c.id.substring(0, 4).toUpperCase()}
                          </div>
                        </div>
                        <div className="text-[11.5px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                          {c.suite?.title || "No Suite"}
                        </div>
                        <div className="text-[11.5px] text-text-muted capitalize">
                          {c.priority?.toLowerCase() || "Low"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-[12.5px] text-text-muted">
                No cases included in this plan.
              </div>
            )}
          </div>

          {/* runs from plan */}
          <div className="flex flex-col gap-[16px]">
            <div className="bg-surface border border-border rounded-[13px] shadow-sm overflow-hidden">
              <div className="p-[14px_16px] border-b border-border font-semibold text-[14px]">
                Runs from this plan
              </div>

              {plan.testRuns.length > 0 ? (
                <div>
                  {plan.testRuns.map((r) => {
                    const total = r._count.results || 1; // avoid div by 0
                    const passed = r.results.filter(
                      (res: any) => res.status === "PASSED",
                    ).length;
                    const passPercent = Math.round((passed / total) * 100);

                    const C = 94.2;
                    const ringOffset = C * (1 - passPercent / 100);
                    const ringColor =
                      passPercent >= 90
                        ? "var(--success)"
                        : passPercent >= 75
                          ? "var(--warning)"
                          : "var(--danger)";

                    let stBg = "var(--bg-surface-hover)";
                    let stColor = "var(--text-muted)";
                    let stLabel: string = r.status;

                    if (r.status === "COMPLETED") {
                      stBg = "var(--success-soft)";
                      stColor = "var(--success)";
                    } else if (r.status === "ABORTED") {
                      stBg = "var(--danger-soft)";
                      stColor = "var(--danger)";
                    } else if (
                      r.status === "ACTIVE" ||
                      r.status === "IN_PROGRESS"
                    ) {
                      stBg = "var(--primary-light)";
                      stColor = "var(--primary)";
                      stLabel = "Active";
                    }

                    return (
                      <Link
                        key={r.id}
                        href={`/projects/${code}/runs/${r.id}`}
                        className="flex items-center gap-[12px] p-[12px_16px] border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                      >
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 38 38"
                          className="shrink-0"
                        >
                          <circle
                            cx="19"
                            cy="19"
                            r="15"
                            fill="none"
                            stroke="var(--border-color)"
                            strokeWidth="4"
                          ></circle>
                          <circle
                            cx="19"
                            cy="19"
                            r="15"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="94.2"
                            strokeDashoffset={ringOffset}
                            transform="rotate(-90 19 19)"
                          ></circle>
                          <text
                            x="19"
                            y="20"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              fill: "var(--text-main)",
                              fontFamily: "Inter",
                            }}
                          >
                            {passPercent}
                          </text>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-text-main">
                            {r.title}
                          </div>
                          <div className="text-[10.5px] text-text-faint mt-[1px]">
                            {new Date(r.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-[4px] text-[10px] font-bold p-[2px_8px] rounded-full capitalize"
                          style={{ background: stBg, color: stColor }}
                        >
                          {stLabel.toLowerCase()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-[22px] text-center border-t border-dashed border-[var(--border-strong)] m-[16px] rounded-[13px]">
                  <div className="text-[12px] font-semibold text-text-muted">
                    No runs yet?
                  </div>
                  <div className="text-[11.5px] text-text-faint m-[4px_0_12px]">
                    Start your first run from this plan to track results here.
                  </div>
                  <ButtonLink
                    href={`/projects/${code}/runs/create?plan=${planId}`}
                    variant="secondary"
                    size="sm"
                  >
                    <Play size={16} />
                    Start run
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
