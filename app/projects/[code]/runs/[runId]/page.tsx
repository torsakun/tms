export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import RunExecutionClient from "@/components/runs/RunExecutionClient";
import { notFound } from "next/navigation";

export default async function RunExecutionPage({ params }: { params: Promise<{ code: string, runId: string }> }) {
  const { code, runId } = await params;

  const project = await prisma.project.findUnique({
    where: { code }
  });

  if (!project) return notFound();

  const run = await prisma.testRun.findUnique({
    where: { id: runId },
    include: {
      environment: true,
      milestone: true,
      author: { select: { id: true, name: true, email: true } },
      results: {
        include: {
          testCase: {
            include: { steps: true }
          },
          assignee: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  if (!run) return notFound();

  const suites = await prisma.testSuite.findMany({
    where: { projectId: project.id },
    orderBy: { position: 'asc' }
  });

  return <RunExecutionClient run={run} suites={suites} projectCode={code} runId={runId} />;
}
