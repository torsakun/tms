import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.testCase.delete({
    where: { id: 'some-id', projectId: 'some-project-id' }
  });
}
