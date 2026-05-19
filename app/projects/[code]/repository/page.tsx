import Link from "next/link";
import { SuiteTree } from "@/components/repository/SuiteTree";
import { RepositoryContent } from "@/components/repository/RepositoryContent";
import { prisma } from "@/lib/prisma";

export default async function RepositoryPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ code: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const activeSuiteId = typeof resolvedSearchParams.suite === 'string' ? resolvedSearchParams.suite : null;
  
  let cases: any[] = [];
  let suites: any[] = [];
  try {
    const project = await prisma.project.findFirst({
      where: { code }
    });
    
    if (project) {
      // Fetch suites
      suites = await prisma.testSuite.findMany({
        where: { projectId: project.id },
        orderBy: { position: 'asc' }
      });

      // Fetch cases (all for the project to build the tree)
      cases = await prisma.testCase.findMany({
        where: { projectId: project.id },
        include: { tags: true, steps: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  } catch (err) {
    console.error("Failed to fetch cases:", err);
  }

  return (
    <div className="flex flex-col flex-1 w-full bg-white overflow-hidden">
      
      {/* Top Header matching Qase layout */}
      <div className="flex-none px-6 py-4 border-b border-border/50">
        <div className="flex items-baseline space-x-3">
          <h1 className="text-2xl font-bold text-slate-800">{code} repository</h1>
          <span className="text-[13px] text-slate-500 font-medium">
            {cases.length} cases ({cases.length}) | {suites.length} suites ({suites.length})
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Suite Tree */}
        <aside className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <SuiteTree initialSuites={suites} cases={cases} projectCode={code} />
        </aside>

        {/* Middle Pane: Case List and Slide-over */}
        <RepositoryContent 
          projectCode={code} 
          suites={suites} 
          cases={cases} 
          activeSuiteId={activeSuiteId} 
        />
      </div>
    </div>
  );
}