/**
 * One-off migration: pull Test Suites / Cases (and optionally Runs + Results)
 * from Qase.io into a QMaster project via the Qase REST API v1.
 *
 * Idempotent: every created record stores its Qase id in `externalId`, so
 * re-running skips/updates instead of duplicating.
 *
 * USAGE
 *   QASE_TOKEN=xxxxx \
 *   QASE_PROJECT=DEMO \        # the Qase project CODE (their side)
 *   TARGET_PROJECT=PRO \       # the QMaster project code (our side, must exist)
 *   npx tsx scripts/migrate-qase.ts [--runs] [--dry-run]
 *
 *   --runs      also migrate test runs + their results (default: cases only)
 *   --dry-run   print what WOULD happen, write nothing
 *
 * NOTE: run `prisma db push` first so the `externalId` columns exist.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ── config from env / argv ─────────────────────────────────────────────
const QASE_TOKEN = process.env.QASE_TOKEN || "";
const QASE_PROJECT = process.env.QASE_PROJECT || "";
const TARGET_PROJECT = process.env.TARGET_PROJECT || "";
const INCLUDE_RUNS = process.argv.includes("--runs");
const DRY_RUN = process.argv.includes("--dry-run");

const QASE_BASE = "https://api.qase.io/v1";

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!QASE_TOKEN) fail("QASE_TOKEN env var is required.");
if (!QASE_PROJECT) fail("QASE_PROJECT env var (Qase project code) is required.");
if (!TARGET_PROJECT) fail("TARGET_PROJECT env var (QMaster project code) is required.");

const log = (...a: unknown[]) => console.log(...a);
const dryTag = DRY_RUN ? "[dry-run] " : "";

// ── Qase API helpers ────────────────────────────────────────────────────
async function qaseGet(path: string): Promise<any> {
  const res = await fetch(`${QASE_BASE}${path}`, {
    headers: { Token: QASE_TOKEN, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    fail(`Qase API ${path} → ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Fetch every page of a Qase list endpoint (100/page). */
async function qaseList(resource: string): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  const limit = 100;
  // Qase paginates with { result: { total, entities: [...] } }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sep = resource.includes("?") ? "&" : "?";
    const data = await qaseGet(`${resource}${sep}limit=${limit}&offset=${offset}`);
    const entities: any[] = data?.result?.entities || [];
    out.push(...entities);
    const total: number = data?.result?.total ?? out.length;
    offset += limit;
    if (offset >= total || entities.length === 0) break;
    await new Promise((r) => setTimeout(r, 150)); // be gentle on rate limits
  }
  return out;
}

// ── enum mappers (Qase → QMaster). Qase sends ints in the API. ───────────
// Adjust these if your Qase instance uses custom values.
const PRIORITY: Record<number, "HIGH" | "MEDIUM" | "LOW" | "NOT_SET"> = {
  0: "NOT_SET", // undefined
  1: "HIGH",
  2: "MEDIUM",
  3: "LOW",
};
const SEVERITY: Record<
  number,
  "NOT_SET" | "BLOCKER" | "CRITICAL" | "MAJOR" | "NORMAL" | "MINOR" | "TRIVIAL"
> = {
  0: "NOT_SET",
  1: "BLOCKER",
  2: "CRITICAL",
  3: "MAJOR",
  4: "NORMAL",
  5: "MINOR",
  6: "TRIVIAL",
};
const AUTOMATION: Record<number, "MANUAL" | "TO_BE_AUTOMATED" | "AUTOMATED"> = {
  0: "MANUAL", // is-not-automated
  1: "TO_BE_AUTOMATED",
  2: "AUTOMATED", // is-automated
};

const mapPriority = (v: unknown) => PRIORITY[Number(v)] ?? "MEDIUM";
const mapSeverity = (v: unknown) => SEVERITY[Number(v)] ?? "NORMAL";
const mapAutomation = (v: unknown) => AUTOMATION[Number(v)] ?? "MANUAL";

// Qase result status is a string; our enum matches once uppercased.
const RESULT_STATUS: Record<string, "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED" | "INVALID" | "IN_PROGRESS"> = {
  passed: "PASSED",
  failed: "FAILED",
  blocked: "BLOCKED",
  skipped: "SKIPPED",
  invalid: "INVALID",
  in_progress: "IN_PROGRESS",
  untested: "IN_PROGRESS",
};
const mapResultStatus = (v: unknown) =>
  RESULT_STATUS[String(v).toLowerCase()] ?? "IN_PROGRESS";

// Qase run status → our TestRunStatus.
const mapRunStatus = (v: unknown): "ACTIVE" | "COMPLETED" | "ABORTED" => {
  const s = String(v).toLowerCase();
  if (s === "complete" || s === "completed" || s === "passed" || s === "1")
    return "COMPLETED";
  if (s === "abort" || s === "aborted") return "ABORTED";
  return "ACTIVE";
};

// ── main ──────────────────────────────────────────────────────────────
async function main() {
  log(`\n${dryTag}Qase → QMaster migration`);
  log(`  Qase project:   ${QASE_PROJECT}`);
  log(`  Target project: ${TARGET_PROJECT}`);
  log(`  Include runs:   ${INCLUDE_RUNS ? "yes" : "no"}\n`);

  const project = await prisma.project.findUnique({
    where: { code: TARGET_PROJECT },
  });
  if (!project) fail(`QMaster project "${TARGET_PROJECT}" not found. Create it first.`);
  const projectId = project.id;

  // ── 1. SUITES ─────────────────────────────────────────────────────────
  const qaseSuites = await qaseList(`/suite/${QASE_PROJECT}`);
  log(`Fetched ${qaseSuites.length} suites from Qase`);

  // qaseSuiteId → qmasterSuiteId
  const suiteMap = new Map<number, string>();

  // Pass 1: create/find every suite (no parent yet)
  for (const s of qaseSuites) {
    const existing = await prisma.testSuite.findFirst({
      where: { projectId, externalId: String(s.id) },
      select: { id: true },
    });
    if (existing) {
      suiteMap.set(s.id, existing.id);
      continue;
    }
    if (DRY_RUN) {
      log(`  ${dryTag}suite: ${s.title}`);
      suiteMap.set(s.id, `dry-${s.id}`);
      continue;
    }
    const created = await prisma.testSuite.create({
      data: {
        title: s.title || "Untitled suite",
        description: s.description || null,
        projectId,
        externalId: String(s.id),
      },
      select: { id: true },
    });
    suiteMap.set(s.id, created.id);
  }

  // Pass 2: wire parentId now that all suites exist
  if (!DRY_RUN) {
    for (const s of qaseSuites) {
      if (!s.parent_id) continue;
      const childId = suiteMap.get(s.id);
      const parentId = suiteMap.get(s.parent_id);
      if (childId && parentId) {
        await prisma.testSuite.update({ where: { id: childId }, data: { parentId } });
      }
    }
  }
  log(`✓ Suites done (${suiteMap.size})\n`);

  // ── 2. CASES ──────────────────────────────────────────────────────────
  const qaseCases = await qaseList(`/case/${QASE_PROJECT}`);
  log(`Fetched ${qaseCases.length} cases from Qase`);

  // qaseCaseId → qmasterCaseId  (needed to attach run results later)
  const caseMap = new Map<number, string>();

  // sequenceNumber must be unique per project — continue from the current max.
  const maxSeq = await prisma.testCase.aggregate({
    where: { projectId },
    _max: { sequenceNumber: true },
  });
  let seq = (maxSeq._max.sequenceNumber || 0) + 1;

  let createdCases = 0;
  for (const c of qaseCases) {
    const existing = await prisma.testCase.findFirst({
      where: { projectId, externalId: String(c.id) },
      select: { id: true },
    });
    if (existing) {
      caseMap.set(c.id, existing.id);
      continue;
    }
    if (DRY_RUN) {
      caseMap.set(c.id, `dry-${c.id}`);
      createdCases++;
      continue;
    }

    const steps = Array.isArray(c.steps)
      ? c.steps.map((st: any, i: number) => ({
          action: String(st.action || st.hash || ""),
          expectedResult: st.expected_result || st.expected || null,
          position: i,
        }))
      : [];

    const created = await prisma.testCase.create({
      data: {
        title: c.title || "Untitled case",
        description: c.description || null,
        preconditions: c.preconditions || null,
        postconditions: c.postconditions || null,
        priority: mapPriority(c.priority),
        severity: mapSeverity(c.severity),
        automationStatus: mapAutomation(c.automation),
        projectId,
        suiteId: c.suite_id ? suiteMap.get(c.suite_id) || null : null,
        sequenceNumber: seq++,
        externalId: String(c.id),
        steps: steps.length ? { create: steps } : undefined,
      },
      select: { id: true },
    });
    caseMap.set(c.id, created.id);
    createdCases++;
  }
  log(`✓ Cases done (${createdCases} new, ${caseMap.size} total mapped)\n`);

  // ── 3. RUNS + RESULTS (optional) ──────────────────────────────────────
  if (!INCLUDE_RUNS) {
    log("Skipping runs (pass --runs to include them).");
  } else {
    const qaseRuns = await qaseList(`/run/${QASE_PROJECT}`);
    log(`Fetched ${qaseRuns.length} runs from Qase`);

    for (const r of qaseRuns) {
      let runId: string;
      const existingRun = await prisma.testRun.findFirst({
        where: { projectId, externalId: String(r.id) },
        select: { id: true },
      });
      if (existingRun) {
        runId = existingRun.id;
      } else if (DRY_RUN) {
        log(`  ${dryTag}run: ${r.title}`);
        continue;
      } else {
        const created = await prisma.testRun.create({
          data: {
            title: r.title || `Qase run ${r.id}`,
            description: r.description || null,
            status: mapRunStatus(r.status),
            projectId,
            externalId: String(r.id),
          },
          select: { id: true },
        });
        runId = created.id;
      }

      // results for this run
      const results = await qaseList(`/result/${QASE_PROJECT}?run=${r.id}`);
      if (DRY_RUN) {
        log(`  ${dryTag}run "${r.title}" → ${results.length} results`);
        continue;
      }
      const rowMap = new Map<string, Prisma.TestRunResultCreateManyInput>();
      for (const res of results) {
        const caseId = res.case_id ? caseMap.get(res.case_id) : undefined;
        if (!caseId) continue; // result for a case we didn't migrate
        rowMap.set(caseId, {
          runId,
          caseId,
          status: mapResultStatus(res.status),
          comment: res.comment || null,
          timeSpent: typeof res.time_spent === "number" ? res.time_spent : null,
        });
      }
      
      const rows = Array.from(rowMap.values());
      if (rows.length) {
        // Fresh run → bulk insert; existing run → skip to stay idempotent.
        if (!existingRun) await prisma.testRunResult.createMany({ data: rows });
      }
      log(`  ✓ run "${r.title}" (${rows.length} results)`);
    }
    log(`✓ Runs done`);
  }

  log(`\n${dryTag}Migration complete.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
