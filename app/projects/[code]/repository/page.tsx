import Link from "next/link";
import { SuiteTree } from "@/components/repository/SuiteTree";
import { RepositoryContent } from "@/components/repository/RepositoryContent";
import { ResizableLayout } from "@/components/repository/ResizableLayout";
import { SuiteExpansionProvider } from "@/components/providers/SuiteExpansionProvider";
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

  const allSuiteIds = suites.map(s => s.id);

  return (
    <SuiteExpansionProvider initialExpandedIds={allSuiteIds}>
      <div className="flex flex-col flex-1 w-full bg-white overflow-hidden h-full">
        
        {/* Top Header matching Qase layout */}
        <div className="flex-none px-6 py-4 border-b border-border/50">
          <div className="flex items-baseline space-x-3">
            <h1 className="text-2xl font-bold text-slate-800">{code} repository</h1>
            <span className="text-[13px] text-slate-500 font-medium">
              {cases.length} cases ({cases.length}) | {suites.length} suites ({suites.length})
            </span>
          </div>
        </div>

        <ResizableLayout 
          leftPane={<SuiteTree initialSuites={suites} cases={cases} projectCode={code} />}
          rightPane={<RepositoryContent projectCode={code} suites={suites} cases={cases} activeSuiteId={activeSuiteId} />}
        />
      </div>
    </SuiteExpansionProvider>
  );
}