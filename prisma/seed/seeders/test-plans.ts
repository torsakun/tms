import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';
import { SeededProjects } from './projects';

const PROJECT_SLUGS: Record<string, string> = {
  FIN: 'finpay',
  SHZ: 'shopzen',
  MED: 'meditrack',
};

interface PlanData {
  id: string;
  title: string;
  description?: string;
  testCaseIds: string[];
}

// projectCode → planId[]
export type SeededTestPlans = Record<string, string[]>;

export async function seedTestPlans(
  prisma: PrismaClient,
  projects: SeededProjects
): Promise<SeededTestPlans> {
  log.section('📋 Seeding Test Plans...');

  const result: SeededTestPlans = {};

  for (const project of projects.list) {
    const slug = PROJECT_SLUGS[project.code];
    const plans: PlanData[] = JSON.parse(
      readFileSync(join(__dirname, `../data/projects/${slug}/test-plans.json`), 'utf-8')
    );

    const planIds: string[] = [];

    for (const plan of plans) {
      await prisma.testPlan.upsert({
        where: { id: plan.id },
        update: {
          title: plan.title,
          description: plan.description,
          testCases: { set: plan.testCaseIds.map(id => ({ id })) },
        },
        create: {
          id: plan.id,
          title: plan.title,
          description: plan.description,
          projectId: project.id,
          testCases: { connect: plan.testCaseIds.map(id => ({ id })) },
        },
      });
      planIds.push(plan.id);
      log.success(`${project.name} / ${plan.title} (${plan.testCaseIds.length} cases)`);
    }

    result[project.code] = planIds;
  }

  log.summary(`${Object.values(result).flat().length} test plans seeded`);
  return result;
}
