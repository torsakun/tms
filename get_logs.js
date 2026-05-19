const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:QaseSecurePassword2026xyz@164.68.113.171:5432/inhouse_qase?schema=public"
    }
  }
});
async function main() {
  const d = await prisma.deploymentLog.findFirst({ orderBy: { createdAt: 'desc' }});
  console.log("STATUS:", d.status);
  console.log("LOGS:\n", d.logs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
