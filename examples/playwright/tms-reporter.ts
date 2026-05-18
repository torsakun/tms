import type {
  Reporter,
  TestCase,
  TestResult
} from "@playwright/test/reporter";

type TmsResult = {
  caseKey?: string;
  title: string;
  status: string;
  durationMs: number;
  logs: string;
  errorMessage?: string;
  file?: string;
  line?: number;
};

function extractCaseKey(title: string) {
  const bracketMatch = title.match(/\[([A-Z][A-Z0-9_-]*-\d+)\]/i);
  if (bracketMatch?.[1]) return bracketMatch[1].toUpperCase();

  const tagMatch = title.match(/@([A-Z][A-Z0-9_-]*-\d+)/i);
  if (tagMatch?.[1]) return tagMatch[1].toUpperCase();

  return undefined;
}

function mapStatus(status: TestResult["status"]) {
  if (status === "passed") return "PASSED";
  if (status === "skipped") return "SKIPPED";
  if (status === "timedOut" || status === "interrupted") return "FAILED";
  return "FAILED";
}

function collectLogs(result: TestResult) {
  const stdout = result.stdout.map((item) => item.toString()).join("");
  const stderr = result.stderr.map((item) => item.toString()).join("");
  return [stdout, stderr].filter(Boolean).join("\n");
}

class TmsReporter implements Reporter {
  private results: TmsResult[] = [];
  private apiUrl = process.env.TMS_API_URL || "http://localhost:3000";
  private projectCode = process.env.TMS_PROJECT_CODE || "AUTO";
  private runTitle = process.env.TMS_RUN_TITLE || `Playwright Run ${new Date().toISOString()}`;
  private runId = process.env.TMS_RUN_ID;
  private token = process.env.TMS_API_TOKEN;

  onBegin() {
    console.log(`[TMS] Reporting results to ${this.apiUrl} for project ${this.projectCode}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const title = test.titlePath().slice(1).join(" > ");
    const errorMessage = result.error?.message || result.errors.map((error) => error.message).join("\n");

    this.results.push({
      caseKey: extractCaseKey(title),
      title,
      status: mapStatus(result.status),
      durationMs: result.duration,
      logs: collectLogs(result),
      errorMessage: errorMessage || undefined,
      file: test.location.file,
      line: test.location.line
    });
  }

  async onEnd() {
    if (this.results.length === 0) return;

    const endpoint = `${this.apiUrl.replace(/\/$/, "")}/api/playwright/results`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({
        projectCode: this.projectCode,
        runId: this.runId,
        runTitle: this.runTitle,
        tests: this.results
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[TMS] Failed to report Playwright results: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log(`[TMS] Saved ${data.results?.length || 0} results to run ${data.run?.id}`);
  }
}

export default TmsReporter;
