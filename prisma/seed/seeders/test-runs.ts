import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';
import { SeededProjects } from './projects';
import { SeededEnvironments } from './environments';
import { SeededUsers } from './users';

const PROJECT_SLUGS: Record<string, string> = {
  FIN: 'finpay',
  SHZ: 'shopzen',
  MED: 'meditrack',
};

interface ResultData {
  caseId: string;
  status: string;
  timeSpent: number | null;
  assigneeEmail?: string;
  comment?: string;
}

interface RunData {
  id: string;
  title: string;
  description?: string;
  status: string;
  planId?: string;
  environmentSlug?: string;
  results: ResultData[];
}

export async function seedTestRuns(
  prisma: PrismaClient,
  projects: SeededProjects,
  environments: SeededEnvironments,
  users: SeededUsers
): Promise<void> {
  log.section('🚀 Seeding Test Runs...');

  let totalRuns = 0;
  let totalResults = 0;

  for (const project of projects.list) {
    const slug = PROJECT_SLUGS[project.code];
    const runs: RunData[] = JSON.parse(
      readFileSync(join(__dirname, `../data/projects/${slug}/test-runs.json`), 'utf-8')
    );

    for (const run of runs) {
      const environmentId = run.environmentSlug
        ? environments[project.code]?.[run.environmentSlug] ?? null
        : null;

      await prisma.testRun.upsert({
        where: { id: run.id },
        update: {
          title: run.title,
          description: run.description,
          status: run.status as any,
          planId: run.planId ?? null,
          environmentId,
        },
        create: {
          id: run.id,
          title: run.title,
          description: run.description,
          status: run.status as any,
          projectId: project.id,
          planId: run.planId ?? null,
          environmentId,
        },
      });

      for (const r of run.results) {
        const assigneeId = r.assigneeEmail ? users.byEmail[r.assigneeEmail]?.id ?? null : null;
        await prisma.testRunResult.upsert({
          where: { runId_caseId: { runId: run.id, caseId: r.caseId } },
          update: {
            status: r.status as any,
            timeSpent: r.timeSpent ?? null,
            comment: r.comment ?? null,
            assigneeId,
          },
          create: {
            runId: run.id,
            caseId: r.caseId,
            status: r.status as any,
            timeSpent: r.timeSpent ?? null,
            comment: r.comment ?? null,
            assigneeId,
          },
        });
      }

      totalResults += run.results.length;
      totalRuns += 1;
      log.success(
        `${project.name} / "${run.title}" [${run.status}] — ${run.results.length} results`
      );
    }
  }

  log.summary(`${totalRuns} test runs, ${totalResults} results seeded`);
}
