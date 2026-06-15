import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';
import { SeededProjects } from './projects';
import { SeededUsers } from './users';

const PROJECT_SLUGS: Record<string, string> = {
  FIN: 'finpay',
  SHZ: 'shopzen',
  MED: 'meditrack',
};

interface StepData { action: string; expectedResult?: string }

interface CaseData {
  id: string;
  title: string;
  description?: string;
  preconditions?: string;
  suite: string;
  severity: string;
  priority: string;
  automationStatus: string;
  authorEmail?: string;
  steps: StepData[];
}

// projectCode → caseId[]
export type SeededTestCases = Record<string, string[]>;

export async function seedTestCases(
  prisma: PrismaClient,
  projects: SeededProjects,
  users: SeededUsers
): Promise<SeededTestCases> {
  log.section('🧪 Seeding Test Cases...');

  const result: SeededTestCases = {};

  for (const project of projects.list) {
    const slug = PROJECT_SLUGS[project.code];
    const cases: CaseData[] = JSON.parse(
      readFileSync(join(__dirname, `../data/projects/${slug}/test-cases.json`), 'utf-8')
    );

    // Collect unique suite names and upsert them
    const suiteNames = [...new Set(cases.map(c => c.suite))];
    const suiteMap: Record<string, string> = {};
    for (const suiteName of suiteNames) {
      const suiteId = `seed-suite-${project.code.toLowerCase()}-${suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      await prisma.testSuite.upsert({
        where: { id: suiteId },
        update: { title: suiteName },
        create: { id: suiteId, title: suiteName, projectId: project.id },
      });
      suiteMap[suiteName] = suiteId;
    }

    const caseIds: string[] = [];

    for (const tc of cases) {
      const authorId = tc.authorEmail ? users.byEmail[tc.authorEmail]?.id ?? null : null;
      await prisma.testCase.upsert({
        where: { id: tc.id },
        update: {
          title: tc.title,
          description: tc.description,
          preconditions: tc.preconditions,
          severity: tc.severity as any,
          priority: tc.priority as any,
          automationStatus: tc.automationStatus as any,
          suiteId: suiteMap[tc.suite],
          authorId,
        },
        create: {
          id: tc.id,
          title: tc.title,
          description: tc.description,
          preconditions: tc.preconditions,
          severity: tc.severity as any,
          priority: tc.priority as any,
          automationStatus: tc.automationStatus as any,
          projectId: project.id,
          suiteId: suiteMap[tc.suite],
          authorId,
        },
      });

      // Replace steps idempotently
      await prisma.testStep.deleteMany({ where: { caseId: tc.id } });
      if (tc.steps.length > 0) {
        await prisma.testStep.createMany({
          data: tc.steps.map((s, i) => ({
            caseId: tc.id,
            action: s.action,
            expectedResult: s.expectedResult ?? null,
            position: i + 1,
          })),
        });
      }

      caseIds.push(tc.id);
    }

    result[project.code] = caseIds;
    log.success(`${project.name}: ${cases.length} cases across ${suiteNames.length} suites`);
  }

  log.summary(`${Object.values(result).flat().length} test cases seeded`);
  return result;
}
