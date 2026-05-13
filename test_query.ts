import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.testCase.findFirst({ where: { id: { startsWith: '1d26' } } });
  console.log(t);
}
main().finally(() => prisma.$disconnect());
