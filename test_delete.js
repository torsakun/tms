const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find a testcase that exists
    const tc = await prisma.testCase.findFirst({
        include: { runResults: true }
    });
    if (!tc) {
        console.log("No test cases found");
        return;
    }
    console.log("Deleting TC:", tc.id, tc.title);
    await prisma.testCase.delete({ where: { id: tc.id } });
    console.log("Deleted successfully");
  } catch(e) {
    console.error("Delete failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
