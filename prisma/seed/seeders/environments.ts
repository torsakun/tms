import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';
import { SeededProjects } from './projects';

const DATA_PATH = join(__dirname, '../data/environments.json');

interface EnvTemplate { title: string; slug: string; description: string }

// projectCode → slug → environmentId
export type SeededEnvironments = Record<string, Record<string, string>>;

export async function seedEnvironments(
  prisma: PrismaClient,
  projects: SeededProjects
): Promise<SeededEnvironments> {
  log.section('🌍 Seeding Environments...');

  const templates: EnvTemplate[] = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  const result: SeededEnvironments = {};

  for (const project of projects.list) {
    result[project.code] = {};
    for (const tmpl of templates) {
      const envId = `seed-env-${project.code.toLowerCase()}-${tmpl.slug}`;
      await prisma.environment.upsert({
        where: { projectId_slug: { projectId: project.id, slug: tmpl.slug } },
        update: { title: tmpl.title, description: tmpl.description },
        create: {
          id: envId,
          title: tmpl.title,
          slug: tmpl.slug,
          description: tmpl.description,
          projectId: project.id,
        },
      });
      result[project.code][tmpl.slug] = envId;
    }
    log.success(`${project.name}: ${templates.map(t => t.slug).join(', ')}`);
  }

  log.summary(`${projects.list.length * templates.length} environments seeded`);
  return result;
}
