import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/seeders/users';
import { seedProjects } from './seed/seeders/projects';
import { seedEnvironments } from './seed/seeders/environments';
import { seedTestCases } from './seed/seeders/test-cases';
import { seedTestPlans } from './seed/seeders/test-plans';
import { seedTestRuns } from './seed/seeders/test-runs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Starting TMS demo seed...');

  const users = await seedUsers(prisma);
  // Environments are project-scoped, so projects must be seeded first
  const projects = await seedProjects(prisma, users);
  const environments = await seedEnvironments(prisma, projects);
  await seedTestCases(prisma, projects, users);
  await seedTestPlans(prisma, projects);
  await seedTestRuns(prisma, projects, environments, users);

  console.log('\n✅ Seed complete!\n');
  console.log('  Demo credentials (all passwords: Demo1234!)');
  console.log('  ─────────────────────────────────────────────');
  console.log('  owner@testpilot.io        → Admin');
  console.log('  qa.manager@testpilot.io   → QA Manager');
  console.log('  qa.engineer@testpilot.io  → QA Engineer');
  console.log('  viewer@testpilot.io       → Read-only');
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
