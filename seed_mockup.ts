import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:QaseSecurePassword2026xyz@164.68.113.171:5432/inhouse_qase?schema=public",
    },
  },
});

async function main() {
  console.log('Seeding mockup data...');
  
  // 1. Workspace Roles
  const adminRole = await prisma.workspaceRole.upsert({
    where: { id: 'admin-role-id' },
    update: {},
    create: {
      id: 'admin-role-id',
      title: 'Admin',
      description: 'Full access to the workspace',
      isDefault: false,
      permissions: ['ALL']
    }
  });

  const memberRole = await prisma.workspaceRole.upsert({
    where: { id: 'member-role-id' },
    update: {},
    create: {
      id: 'member-role-id',
      title: 'Member',
      description: 'Standard member access',
      isDefault: true,
      permissions: ['PROJECT_READ', 'TEST_CASE_READ', 'TEST_CASE_WRITE']
    }
  });

  // 2. Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'supat.tor@gmail.com' },
    update: {},
    create: {
      email: 'supat.tor@gmail.com',
      passwordHash,
      name: 'Supat Tor',
      role: 'ADMIN',
      workspaceRoleId: adminRole.id
    }
  });
  console.log('User created: supat.tor@gmail.com / password123');

  // 3. Create 10 Projects and thousands of Test Cases
  const projectNames = [
    'E-Commerce Platform',
    'Mobile Banking App',
    'HR Management System',
    'Customer Portal',
    'Admin Dashboard',
    'Inventory System',
    'CRM System',
    'Booking Application',
    'Data Analytics Tool',
    'Marketing Site'
  ];

  console.log('Generating massive mockup data...');
  for (let i = 0; i < projectNames.length; i++) {
    const projName = projectNames[i];
    const code = projName.split(' ').map(w => w[0]).join('').toUpperCase() + i;
    
    // Create Project
    const project = await prisma.project.upsert({
      where: { code },
      update: {},
      create: {
        name: projName,
        code,
        description: `Mockup project for ${projName}`,
        members: {
          create: {
            userId: user.id
          }
        }
      }
    });
    console.log(`Created Project: ${project.name} (${project.code})`);

    // Create 10 Suites for each project
    for (let j = 1; j <= 10; j++) {
      const suite = await prisma.testSuite.create({
        data: {
          title: `Module ${j} - Integration & Features`,
          description: `Test suite covering module ${j} functionalities`,
          projectId: project.id
        }
      });

      // For each suite, create 30 Test Cases using createMany (300 cases per project = 3000 total)
      const casesData = [];
      const priorities = ['HIGH', 'MEDIUM', 'LOW'] as const;
      const severities = ['BLOCKER', 'CRITICAL', 'MAJOR', 'NORMAL', 'MINOR', 'TRIVIAL'] as const;
      const statuses = ['ACTUAL', 'DRAFT', 'DEPRECATED'] as const;
      const automations = ['MANUAL', 'TO_BE_AUTOMATED', 'AUTOMATED'] as const;

      for (let k = 1; k <= 30; k++) {
        casesData.push({
          title: `Verify functionality ${k} in Module ${j}`,
          description: `Detailed description for test case ${k} in suite ${j}.`,
          preconditions: 'System is running.',
          severity: severities[Math.floor(Math.random() * severities.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          automationStatus: automations[Math.floor(Math.random() * automations.length)],
          projectId: project.id,
          suiteId: suite.id,
          authorId: user.id
        });
      }

      await prisma.testCase.createMany({
        data: casesData
      });
    }
  }

  console.log('Massive mockup data seeded successfully! (10 Projects, 100 Suites, 3000 Test Cases)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
