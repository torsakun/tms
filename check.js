const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findMany();
  console.log('Projects:', p);
}
main().then(() => prisma.$disconnect());
