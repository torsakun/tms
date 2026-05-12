const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.testCase.findMany({
    where: {
      automationScript: {
        contains: 'TODO_'
      }
    }
  });

  console.log(`Found ${cases.length} cases to fix.`);

  for (const tc of cases) {
    let script = tc.automationScript;
    script = script.replace(/TODO_PROJECT_PAGE_URL/g, 'http://164.68.113.171:3000/projects/QA');
    script = script.replace(/TODO_ADD_TEST_CASE_PAGE_URL/g, 'http://164.68.113.171:3000/projects/QA/cases/create');
    
    await prisma.testCase.update({
      where: { id: tc.id },
      data: { automationScript: script }
    });
    console.log(`Fixed ${tc.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
