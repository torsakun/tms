// Creates a QMaster test run holding the 8 UI cases (from e2e/case-map.json),
// with one IN_PROGRESS result per case so the Playwright reporter webhook can
// update them by (runId, caseId). Prints the run id as: RUN_ID=<id>
//
// Run: node --env-file=.env scripts/create-e2e-run.mjs
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const map = JSON.parse(readFileSync(resolve(__dirname, "../e2e/case-map.json"), "utf8"));
  const caseIds = Object.values(map.cases).map((c) => c.qmasterId);

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  const run = await prisma.testRun.create({
    data: {
      title: `E2E UI Run — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      description: "Automated Playwright UI run (Auth + Core CRUD)",
      projectId: map.projectId,
      status: "ACTIVE",
      authorId: admin?.id,
      results: {
        create: caseIds.map((caseId) => ({ caseId, status: "IN_PROGRESS" })),
      },
    },
    include: { results: true },
  });

  console.error(`Created run "${run.title}" with ${run.results.length} case(s)`);
  // Machine-readable line for the shell to capture
  console.log(`RUN_ID=${run.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
