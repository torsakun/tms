/**
 * One-off cleanup: drop result-level Attachment rows that duplicate a
 * step-level image on the same run result.
 *
 * WHY
 * The retired migrate-step-attachments.ts pulled Qase's *per-step* evidence but
 * filed it as result-level Attachment rows. migrate-attachments.ts now stores
 * that same evidence under TestRunResult.stepResults, where the execution page
 * renders it beneath its own step — so those old rows show every image a second
 * time in the "Evidence" panel.
 *
 * WHAT IT DELETES
 * An Attachment row is removed only when ALL of these hold:
 *   • it belongs to a run result (resultId is set), and
 *   • that same result has a step-level attachment with the same originalName.
 * Genuinely result-level evidence (a full-page shot, a video not tied to one
 * step) has no step-level twin and is left untouched.
 *
 * NOTE: this deletes DB rows only. The S3 objects stay — the duplicate was
 * uploaded under its own key, so the copy shown under the step is a different
 * object and must not be removed.
 *
 * USAGE
 *   npx tsx scripts/dedupe-result-attachments.ts --dry-run   # report only
 *   npx tsx scripts/dedupe-result-attachments.ts             # apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const tag = DRY_RUN ? "[dry-run] " : "";

  const results = await prisma.testRunResult.findMany({
    where: { attachments: { some: {} } },
    select: {
      id: true,
      stepResults: true,
      attachments: { select: { id: true, originalName: true } },
    },
  });

  const doomed: string[] = [];
  let keptUnique = 0;
  let resultsTouched = 0;
  const sample: string[] = [];

  for (const r of results) {
    // Every filename that already renders under one of this result's steps.
    const stepNames = new Set<string>();
    const sr = (r.stepResults as Record<string, any>) || {};
    for (const key of Object.keys(sr)) {
      for (const a of sr[key]?.attachments || []) {
        if (a?.name) stepNames.add(a.name);
      }
    }
    if (stepNames.size === 0) {
      keptUnique += r.attachments.length;
      continue;
    }

    let hit = false;
    for (const a of r.attachments) {
      if (stepNames.has(a.originalName)) {
        doomed.push(a.id);
        hit = true;
        if (sample.length < 5) sample.push(`${a.originalName}  (result ${r.id.slice(0, 8)})`);
      } else {
        keptUnique++;
      }
    }
    if (hit) resultsTouched++;
  }

  console.log(`\n${tag}Result-level attachments scanned across ${results.length} run result(s)`);
  console.log(`  duplicated by a step-level image → delete: ${doomed.length}`);
  console.log(`  unique to the Evidence panel     → keep:   ${keptUnique}`);
  console.log(`  run results affected:                      ${resultsTouched}`);

  if (doomed.length === 0) {
    console.log("\n✓ Nothing to clean up.\n");
    return;
  }

  console.log(`\n  examples:`);
  for (const s of sample) console.log(`    ${s}`);

  if (DRY_RUN) {
    console.log(`\n${tag}No rows deleted. Re-run without --dry-run to apply.\n`);
    return;
  }

  // Chunked so a single statement never carries thousands of ids.
  let deleted = 0;
  const CHUNK = 500;
  for (let i = 0; i < doomed.length; i += CHUNK) {
    const batch = doomed.slice(i, i + CHUNK);
    const res = await prisma.attachment.deleteMany({ where: { id: { in: batch } } });
    deleted += res.count;
    console.log(`  deleted ${deleted}/${doomed.length}…`);
  }

  console.log(`\n✓ Removed ${deleted} duplicate attachment row(s). S3 objects were left in place.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
