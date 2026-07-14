import type {
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Custom Playwright reporter that pushes each test outcome back into QMaster
 * via the reporter webhook (POST /api/webhooks/playwright/reporter).
 *
 * Enabled only when QMASTER_RUN_ID is set (Phase 5 creates the run and exports
 * the id). Without it, the reporter is a no-op so `npx playwright test` runs
 * normally without touching QMaster.
 *
 * Mapping: each test title begins with a doc id (e.g. "QMS-01"), which we
 * resolve to the real QMaster case id through e2e/case-map.json.
 */
const BASE = process.env.QMASTER_BASE_URL || "http://localhost:3000";
const RUN_ID = process.env.QMASTER_RUN_ID;

type CaseMap = Record<string, { qmasterId: string; shortId: string; title: string }>;

class QMasterReporter implements Reporter {
  private cases: CaseMap = {};
  private posts: Promise<void>[] = [];
  private sent = 0;

  onBegin() {
    if (!RUN_ID) {
      console.log("[qmaster-reporter] QMASTER_RUN_ID not set — skipping result upload.");
      return;
    }
    const mapPath = path.join(__dirname, "case-map.json");
    this.cases = JSON.parse(readFileSync(mapPath, "utf8")).cases;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!RUN_ID) return;

    const docId = (test.title.match(/QMS-\d+/) || [])[0];
    if (!docId || !this.cases[docId]) return; // e.g. the setup step

    const caseId = this.cases[docId].qmasterId;
    const status =
      result.status === "passed"
        ? "PASSED"
        : result.status === "skipped"
          ? "SKIPPED"
          : "FAILED";

    const logs =
      `[${docId}] ${test.title}\n` +
      `status=${result.status} duration=${result.duration}ms\n` +
      (result.error?.message ? `error: ${result.error.message}` : "no errors");

    this.posts.push(
      fetch(`${BASE}/api/webhooks/playwright/reporter`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: RUN_ID, caseId, status, logs }),
      })
        .then(async (res) => {
          if (res.ok) {
            this.sent++;
            console.log(`[qmaster-reporter] ${docId} → ${status} ✓`);
          } else {
            const body = await res.text();
            console.warn(`[qmaster-reporter] ${docId} → ${res.status} ${body}`);
          }
        })
        .catch((e) => console.warn(`[qmaster-reporter] ${docId} failed: ${e.message}`)),
    );
  }

  async onEnd() {
    if (!RUN_ID) return;
    await Promise.allSettled(this.posts);
    console.log(`[qmaster-reporter] uploaded ${this.sent} result(s) to run ${RUN_ID}`);
  }
}

export default QMasterReporter;
