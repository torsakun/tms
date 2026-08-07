/**
 * One-off migration: pull run-result attachments from Qase.io into QMaster.
 *
 * Migrates BOTH levels of evidence:
 *   • result-level  → Attachment rows (shown in the "Evidence" panel)
 *   • step-level    → TestRunResult.stepResults (shown under each step's
 *                     "Actual result", mirroring how Qase displays them)
 *
 * Run `migrate-qase.ts` first — cases/runs must already carry their
 * `externalId`, which is how records are matched back to Qase.
 *
 * S3 credentials/bucket come from the app's own AWS config (lib/s3.ts), which
 * reads AWS_REGION / AWS_S3_BUCKET and falls back to the default credential
 * provider chain (e.g. the EC2 IAM role) when no access key is set.
 *
 * USAGE
 *   # every project in PROJECT_MAP below
 *   QASE_TOKEN=xxxxx npx tsx scripts/migrate-attachments.ts
 *
 *   # or a single pair
 *   QASE_TOKEN=xxxxx QASE_PROJECT=BO TARGET_PROJECT=BCP \
 *     npx tsx scripts/migrate-attachments.ts
 */

import { PrismaClient } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "../lib/s3";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// ── config from env / argv ─────────────────────────────────────────────
const QASE_TOKEN = process.env.QASE_TOKEN || "";
const QASE_PROJECT = process.env.QASE_PROJECT || "";
const TARGET_PROJECT = process.env.TARGET_PROJECT || "";

const QASE_BASE = "https://api.qase.io/v1";

/** Qase project code → QMaster project code. */
const PROJECT_MAP: Record<string, string> = {
  AWC: "PIK",
  BO: "BCP",
  UFUND: "UFU",
  UPF: "UFC",
  PW: "WPB",
  PWSP: "PTTSAC",
  IUCW: "ISU",
  STFS: "SRI",
  STSD: "STSD",
  WP: "WIN",
};

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!QASE_TOKEN) fail("QASE_TOKEN env var is required.");
// QASE_PROJECT/TARGET_PROJECT are optional: set both to migrate a single pair,
// or leave them unset to walk every entry in PROJECT_MAP.
if (Boolean(QASE_PROJECT) !== Boolean(TARGET_PROJECT)) {
  fail("Set QASE_PROJECT and TARGET_PROJECT together, or neither.");
}

const log = (...a: unknown[]) => console.log(...a);

// ── Qase API helpers ────────────────────────────────────────────────────
async function qaseGet(path: string): Promise<any> {
  const res = await fetch(`${QASE_BASE}${path}`, {
    headers: { Token: QASE_TOKEN, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Throw (not exit) so one failing project doesn't abort the whole batch.
    throw new Error(
      `Qase API ${path} → ${res.status} ${res.statusText} ${body.slice(0, 200)}`,
    );
  }
  return res.json();
}

async function qaseList(resource: string): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const sep = resource.includes("?") ? "&" : "?";
    const data = await qaseGet(`${resource}${sep}limit=${limit}&offset=${offset}`);
    const entities: any[] = data?.result?.entities || [];
    out.push(...entities);
    const total: number = data?.result?.total ?? out.length;
    offset += limit;
    if (offset >= total || entities.length === 0) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}

// ── Download helper ──────────────────────────────────────────────────────
// Uses fetch so redirects are followed (Qase serves attachments off S3 via 302).
async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

/** A Qase attachment can expose its source as `url` or `full_path`. */
function attachmentSource(a: any): string | null {
  return a?.url || a?.full_path || null;
}
function attachmentName(a: any): string {
  return a?.filename || a?.file || "attachment";
}

/** Download from Qase → upload to S3 → return the public URL. */
async function transferToS3(
  a: any,
  projectId: string,
): Promise<{ url: string; size: number; name: string; mime: string } | null> {
  const src = attachmentSource(a);
  if (!src) return null;
  const originalName = attachmentName(a);

  log(`  ↓ Downloading ${originalName}`);
  let buffer: Buffer;
  try {
    buffer = await downloadFile(src);
  } catch (err) {
    log(`  [!] Download failed for ${originalName}: ${err}`);
    return null;
  }

  const extMatch = originalName.match(/\.([^.]+)$/);
  const extension = extMatch ? `.${extMatch[1]}` : "";
  const s3Key = `projects/${projectId}/attachments/${crypto.randomUUID()}${extension}`;
  const mime = a?.mime || "application/octet-stream";

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mime,
      }),
    );
  } catch (err) {
    log(`  [!] S3 upload failed for ${originalName}: ${err}`);
    return null;
  }

  // The bucket is private — serve through our own proxy route so the bytes are
  // same-origin (see app/api/uploads/[...filename]/route.ts). It is a catch-all
  // route, so the nested key works as-is.
  return {
    url: `/api/uploads/${s3Key}`,
    size: a?.size || buffer.length,
    name: originalName,
    mime,
  };
}

// Qase step status → our step status vocabulary used by the execution page.
// The /result endpoint returns step status as a NUMBER (0 untested, 1 passed,
// 2 failed, 3 blocked); other endpoints use the string form. Handle both, and
// deliberately return null for "untested" so we don't stamp a result that the
// tester never actually recorded.
const STEP_STATUS_BY_NUMBER: Record<number, string> = {
  1: "PASSED",
  2: "FAILED",
  3: "BLOCKED",
};
const STEP_STATUS_BY_NAME: Record<string, string> = {
  passed: "PASSED",
  failed: "FAILED",
  blocked: "BLOCKED",
  skipped: "SKIPPED",
};

function mapStepStatus(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return STEP_STATUS_BY_NUMBER[raw] ?? null;
  const s = String(raw).trim().toLowerCase();
  if (s === "") return null;
  // Numeric strings ("1") come through some payloads too.
  if (/^\d+$/.test(s)) return STEP_STATUS_BY_NUMBER[Number(s)] ?? null;
  return STEP_STATUS_BY_NAME[s] ?? null;
}

// ── per-project migration ─────────────────────────────────────────────
/** Returns how many attachments were synced for this project pair. */
async function migrateProject(
  qaseProject: string,
  targetProject: string,
): Promise<{ result: number; step: number }> {
  log(`\n── ${qaseProject} → ${targetProject} ──`);

  const project = await prisma.project.findUnique({
    where: { code: targetProject },
  });
  if (!project) {
    log(`  [!] QMaster project "${targetProject}" not found — skipped.`);
    return { result: 0, step: 0 };
  }
  const projectId = project.id;

  // We need to map Qase case ID to QMaster TestRunResult
  const qaseCases = await qaseList(`/case/${qaseProject}`);
  const caseMap = new Map<number, string>();
  for (const c of qaseCases) {
    const existing = await prisma.testCase.findFirst({
      where: { projectId, externalId: String(c.id) },
      select: { id: true },
    });
    if (existing) caseMap.set(c.id, existing.id);
  }
  log(`  Mapped ${caseMap.size}/${qaseCases.length} cases.`);

  const qaseRuns = await qaseList(`/run/${qaseProject}`);
  log(`  Fetched ${qaseRuns.length} runs from Qase.`);

  let resultAttachments = 0;
  let stepAttachments = 0;

  for (const r of qaseRuns) {
    const existingRun = await prisma.testRun.findFirst({
      where: { projectId, externalId: String(r.id) },
      select: { id: true },
    });
    if (!existingRun) continue;

    const results = await qaseList(`/result/${qaseProject}?run=${r.id}`);
    for (const res of results) {
      const qaseSteps: any[] = Array.isArray(res.steps) ? res.steps : [];
      const hasResultAtt = Array.isArray(res.attachments) && res.attachments.length > 0;
      const hasStepAtt = qaseSteps.some(
        (s) => Array.isArray(s?.attachments) && s.attachments.length > 0,
      );
      if (!hasResultAtt && !hasStepAtt) continue;

      const qmasterCaseId = res.case_id ? caseMap.get(res.case_id) : undefined;
      if (!qmasterCaseId) continue;

      const qmasterResult = await prisma.testRunResult.findUnique({
        where: {
          runId_caseId: { runId: existingRun.id, caseId: qmasterCaseId },
        },
      });
      if (!qmasterResult) continue;

      // ── 1. Result-level evidence → Attachment rows ─────────────────────
      for (const attachment of res.attachments || []) {
        if (!attachmentSource(attachment)) continue;
        const originalName = attachmentName(attachment);

        // Idempotent: skip anything already migrated for this result.
        const already = await prisma.attachment.findFirst({
          where: { resultId: qmasterResult.id, originalName },
          select: { id: true },
        });
        if (already) continue;

        const uploaded = await transferToS3(attachment, projectId);
        if (!uploaded) continue;

        await prisma.attachment.create({
          data: {
            filename: uploaded.url.split("/").pop() || "unknown",
            originalName: uploaded.name,
            mimeType: uploaded.mime,
            size: uploaded.size,
            url: uploaded.url,
            projectId,
            resultId: qmasterResult.id,
            testCaseId: qmasterCaseId,
          },
        });
        log(`  ✓ result evidence: ${uploaded.name}`);
        resultAttachments++;
      }

      // ── 2. Step-level evidence → TestRunResult.stepResults JSON ────────
      // The execution page renders images per step from
      // stepResults[<TestStep.id>].attachments = [{ url, name }].
      if (qaseSteps.length > 0) {
        const ourSteps = await prisma.testStep.findMany({
          where: { caseId: qmasterCaseId },
          orderBy: { position: "asc" },
          select: { id: true },
        });

        const stepResults: Record<string, any> =
          (qmasterResult.stepResults as any) || {};
        let changed = false;

        // Qase steps come back in execution order, which matches the order the
        // case migration created TestStep rows in — so index-align them.
        for (let i = 0; i < qaseSteps.length; i++) {
          const target = ourSteps[i];
          if (!target) continue;
          const qs = qaseSteps[i];

          const entry = stepResults[target.id] || {};
          const status = mapStepStatus(qs?.status);
          if (status && !entry.status) entry.status = status;
          if (qs?.comment && !entry.actualResult) entry.actualResult = qs.comment;

          const existing: any[] = Array.isArray(entry.attachments)
            ? entry.attachments
            : [];

          for (const a of qs?.attachments || []) {
            if (!attachmentSource(a)) continue;
            const name = attachmentName(a);
            if (existing.some((e) => e?.name === name)) continue; // idempotent

            const uploaded = await transferToS3(a, projectId);
            if (!uploaded) continue;

            existing.push({ url: uploaded.url, name: uploaded.name });
            log(`  ✓ step ${i + 1} evidence: ${uploaded.name}`);
            stepAttachments++;
            changed = true;
          }

          if (existing.length > 0) entry.attachments = existing;
          if (Object.keys(entry).length > 0) {
            stepResults[target.id] = entry;
            changed = true;
          }
        }

        if (changed) {
          await prisma.testRunResult.update({
            where: { id: qmasterResult.id },
            data: { stepResults },
          });
        }
      }
    }
  }

  log(
    `  ✔ ${targetProject}: ${resultAttachments} result-level + ${stepAttachments} step-level.`,
  );
  return { result: resultAttachments, step: stepAttachments };
}

// ── main ──────────────────────────────────────────────────────────────
async function main() {
  // One explicit pair, or every entry in PROJECT_MAP.
  const pairs: [string, string][] = QASE_PROJECT
    ? [[QASE_PROJECT, TARGET_PROJECT]]
    : Object.entries(PROJECT_MAP);

  log(`\nQase → QMaster attachment migration`);
  log(`  Projects: ${pairs.map(([q, t]) => `${q}→${t}`).join(", ")}`);

  let totalResult = 0;
  let totalStep = 0;

  for (const [qaseProject, targetProject] of pairs) {
    try {
      const { result, step } = await migrateProject(qaseProject, targetProject);
      totalResult += result;
      totalStep += step;
    } catch (err) {
      // Keep going: one bad project shouldn't abort the whole batch.
      log(`  [!] ${qaseProject} → ${targetProject} failed: ${err}`);
    }
  }

  log(
    `\nMigration complete. ${totalResult} result-level + ${totalStep} step-level attachments synced across ${pairs.length} project(s).\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
