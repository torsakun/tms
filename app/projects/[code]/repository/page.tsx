import { SuiteTree } from "@/components/repository/SuiteTree";
import { RepositoryContent } from "@/components/repository/RepositoryContent";
import { SuiteExpansionProvider } from "@/components/providers/SuiteExpansionProvider";
import { SuiteSelectionProvider } from "@/components/providers/SuiteSelectionProvider";
import { prisma } from "@/lib/prisma";

export default async function RepositoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const activeSuiteId =
    typeof resolvedSearchParams.suite === "string"
      ? resolvedSearchParams.suite
      : null;

  let cases: any[] = [];
  let suites: any[] = [];
  try {
    const project = await prisma.project.findFirst({
      where: { code },
    });

    if (project) {
      suites = await prisma.testSuite.findMany({
        where: { projectId: project.id },
        orderBy: { position: "asc" },
      });

      cases = await prisma.testCase.findMany({
        where: { projectId: project.id },
        include: {
          tags: true,
          steps: true,
          author: { select: { name: true, email: true } },
          linkedIssues: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (err) {
    console.error("Failed to fetch cases:", err);
  }

  const allSuiteIds = suites.map((s) => s.id);

  return (
    <SuiteExpansionProvider initialExpandedIds={allSuiteIds} projectCode={code}>
      <SuiteSelectionProvider>
        <div className="grid min-h-0 flex-1 w-full bg-background overflow-hidden" style={{ gridTemplateColumns: "268px minmax(0, 1fr)" }}>
          <SuiteTree
            initialSuites={suites}
            cases={cases}
            projectCode={code}
          />
          <RepositoryContent
            projectCode={code}
            suites={suites}
            cases={cases}
            activeSuiteId={activeSuiteId}
            totalCases={cases.length}
            totalSuites={suites.length}
          />
        </div>
      </SuiteSelectionProvider>
    </SuiteExpansionProvider>
  );
}
