export const dynamic = 'force-dynamic';

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, Filter, LayoutList, Grid, MoreVertical, AlertTriangle, Check } from "lucide-react";

import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { ProjectList } from "./ProjectList";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  const isCreateModalOpen = create === "true";

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          testCases: true,
          suites: true,
          testRuns: true,
          members: true,
        }
      },
      testRuns: {
        where: { status: 'ACTIVE' },
        select: { id: true }
      },
      testCases: {
        select: {
          automationStatus: true
        }
      }
    }
  });

  const projectsWithLatestRuns = await Promise.all(projects.map(async (project) => {
    // Get latest run
    const latestRun = await prisma.testRun.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      include: { results: true }
    });

    let passRate: number | null = null;
    if (latestRun && latestRun.results.length > 0) {
      const total = latestRun.results.length;
      const passed = latestRun.results.filter(r => r.status === 'PASSED').length;
      passRate = (passed / total) * 100;
    }

    // Automation calc
    const totalCases = project.testCases.length;
    const automatedCases = project.testCases.filter(c => c.automationStatus === 'AUTOMATED').length;
    const automationPercent = totalCases > 0 ? (automatedCases / totalCases) * 100 : 0;

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      testCasesCount: project._count.testCases,
      suitesCount: project._count.suites,
      activeRunsCount: project.testRuns.length,
      testRunsCount: project._count.testRuns,
      milestonesCount: 0, // Mocked for now
      teamMembers: project._count.members,
      automationPercent,
      latestRunPassRate: passRate,
      updatedAt: project.updatedAt.toISOString(),
    };
  }));

  return (
    <main className="flex-1 w-full bg-background overflow-y-auto transition-colors">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-text-main mb-6">Projects</h1>

        {/* Projects List Client Component */}
        <ProjectList initialProjects={projectsWithLatestRuns} />
      </div>
      
      {/* Modal is rendered here but only visible when isCreateModalOpen is true */}
      {isCreateModalOpen && <CreateProjectModal />}
    </main>
  );
}
