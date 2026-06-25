import React from "react";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { TestPlansList } from "./TestPlansList";

export default async function TestPlansPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let plans: any[] = [];
  try {
    const project = await prisma.project.findFirst({
      where: { code },
    });

    if (project) {
      plans = await prisma.testPlan.findMany({
        where: { projectId: project.id },
        include: {
          _count: {
            select: { testCases: true, testRuns: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (err) {
    console.error("Failed to fetch test plans:", err);
  }

  // Convert dates to string for client component props
  const serializedPlans = plans.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 bg-background transition-colors min-h-0">
      <header className="h-16 bg-surface border-b border-border/80 flex items-center justify-between px-8 shrink-0 z-10 relative transition-colors">
        <h1 className="text-xl font-bold text-text-main">Test Plans</h1>
        <div className="flex items-center space-x-3">
          <ButtonLink
            href={`/projects/${code}/plans/create`}
            className="shadow-[var(--shadow-float)] hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Create test plan
          </ButtonLink>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <TestPlansList initialPlans={serializedPlans} code={code} />
      </div>
    </div>
  );
}
