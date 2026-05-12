import { prisma } from './lib/prisma';

async function main() {
  try {
    const projects = await prisma.project.findMany();
    console.log("Success:", projects);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
