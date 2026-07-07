import React from "react";
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
    <div className="flex flex-col flex-1 bg-background antialiased min-h-0 text-[14px]">
      <div className="flex-1 overflow-y-auto">
        <TestPlansList initialPlans={serializedPlans} code={code} />
      </div>
    </div>
  );
}
