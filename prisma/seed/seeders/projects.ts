import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';
import { SeededUsers } from './users';

const PROJECTS = ['finpay', 'shopzen', 'meditrack'] as const;

interface ProjectData {
  id: string;
  name: string;
  code: string;
  description: string;
  members: Array<{ userEmail: string; role: string }>;
}

export type SeededProject = { id: string; name: string; code: string };
export type SeededProjects = { list: SeededProject[]; byCode: Record<string, SeededProject> };

export async function seedProjects(
  prisma: PrismaClient,
  users: SeededUsers
): Promise<SeededProjects> {
  log.section('📁 Seeding Projects...');

  const result: SeededProjects = { list: [], byCode: {} };

  for (const slug of PROJECTS) {
    const data: ProjectData = JSON.parse(
      readFileSync(join(__dirname, `../data/projects/${slug}/project.json`), 'utf-8')
    );

    const project = await prisma.project.upsert({
      where: { id: data.id },
      update: { name: data.name, description: data.description },
      create: { id: data.id, name: data.name, code: data.code, description: data.description },
      select: { id: true, name: true, code: true },
    });

    for (const m of data.members) {
      const user = users.byEmail[m.userEmail];
      if (!user) { log.error(`User not found: ${m.userEmail}`); continue; }
      await prisma.projectMember.upsert({
        where: { userId_projectId: { userId: user.id, projectId: project.id } },
        update: { role: m.role as any },
        create: { userId: user.id, projectId: project.id, role: m.role as any },
      });
    }

    log.success(`${project.name} [${project.code}] — ${data.members.length} members`);
    result.list.push(project);
    result.byCode[project.code] = project;
  }

  log.summary(`${result.list.length} projects seeded`);
  return result;
}
