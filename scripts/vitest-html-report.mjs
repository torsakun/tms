import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const reportDir = path.join(rootDir, "reports", "vitest");
const jsonPath = path.join(reportDir, "results.json");
const htmlPath = path.join(reportDir, "index.html");

mkdirSync(reportDir, { recursive: true });

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const vitestResult = spawnSync(
  npxCommand,
  [
    "vitest",
    "run",
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${jsonPath}`
  ],
  {
    cwd: rootDir,
    stdio: "inherit"
  }
);

try {
  const report = JSON.parse(readFileSync(jsonPath, "utf8"));
  writeFileSync(htmlPath, renderHtml(report), "utf8");
  console.log(`HTML report written to ${htmlPath}`);
} catch (error) {
  console.error("Failed to generate Vitest HTML report:", error);
  process.exit(vitestResult.status || 1);
}

process.exit(vitestResult.status || 0);

function renderHtml(report) {
  const files = report.testResults ?? [];
  const generatedAt = new Date().toLocaleString();
  const totalDuration = files.reduce((sum, file) => sum + Math.max(0, (file.endTime ?? 0) - (file.startTime ?? 0)), 0);
  const rows = files.flatMap((file) =>
    (file.assertionResults ?? []).map((test) => ({
      file: path.relative(rootDir, file.name ?? ""),
      suite: (test.ancestorTitles ?? []).join(" > "),
      name: test.title ?? test.fullName ?? "Unnamed test",
      status: test.status ?? "unknown",
      duration: test.duration ?? 0,
      failures: test.failureMessages ?? []
    }))
  );

  const fileCards = files.map((file) => {
    const assertions = file.assertionResults ?? [];
    const passed = assertions.filter((test) => test.status === "passed").length;
    const failed = assertions.filter((test) => test.status === "failed").length;
    const skipped = assertions.filter((test) => ["pending", "skipped", "todo"].includes(test.status)).length;
    const duration = Math.max(0, (file.endTime ?? 0) - (file.startTime ?? 0));

    return `
      <article class="file-card">
        <div>
          <p class="file-name">${escapeHtml(path.relative(rootDir, file.name ?? ""))}</p>
          <p class="file-meta">${assertions.length} tests • ${formatMs(duration)}</p>
        </div>
        <div class="file-badges">
          <span class="badge passed">${passed} passed</span>
          ${failed ? `<span class="badge failed">${failed} failed</span>` : ""}
          ${skipped ? `<span class="badge skipped">${skipped} skipped</span>` : ""}
        </div>
      </article>
    `;
  }).join("");

  const testRows = rows.map((test) => `
    <tr>
      <td><span class="status ${escapeHtml(test.status)}">${escapeHtml(test.status)}</span></td>
      <td>
        <strong>${escapeHtml(test.name)}</strong>
        <span>${escapeHtml(test.suite)}</span>
      </td>
      <td>${escapeHtml(test.file)}</td>
      <td>${formatMs(test.duration)}</td>
    </tr>
    ${test.failures.length ? `
      <tr class="failure-row">
        <td></td>
        <td colspan="3"><pre>${escapeHtml(test.failures.join("\n\n"))}</pre></td>
      </tr>
    ` : ""}
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vitest Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --panel: #ffffff;
      --text: #182033;
      --muted: #667085;
      --line: #dde3ee;
      --green: #0f9f6e;
      --green-soft: #e8f8f1;
      --red: #d92d20;
      --red-soft: #fff1f0;
      --amber: #b7791f;
      --amber-soft: #fff7e6;
      --blue: #2563eb;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 32rem),
        linear-gradient(180deg, #ffffff 0, var(--bg) 22rem);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }

    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 15px;
    }

    .result-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 800;
      background: ${report.success ? "var(--green-soft)" : "var(--red-soft)"};
      color: ${report.success ? "var(--green)" : "var(--red)"};
      border: 1px solid ${report.success ? "rgba(15, 159, 110, .25)" : "rgba(217, 45, 32, .25)"};
      white-space: nowrap;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .metric, .panel, .file-card {
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid var(--line);
      box-shadow: 0 18px 50px rgba(34, 48, 73, 0.08);
      backdrop-filter: blur(12px);
    }

    .metric {
      border-radius: 14px;
      padding: 18px;
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 34px;
      line-height: 1;
    }

    .panel {
      border-radius: 16px;
      margin-top: 18px;
      overflow: hidden;
    }

    .panel-heading {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--line);
    }

    .panel-heading h2 {
      margin: 0;
      font-size: 18px;
    }

    .panel-heading p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    .file-list {
      display: grid;
      gap: 10px;
      padding: 16px;
    }

    .file-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: none;
    }

    .file-name {
      margin: 0;
      font-weight: 800;
    }

    .file-meta {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    .file-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .badge, .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 5px 9px;
      font-size: 12px;
      font-weight: 800;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .passed { background: var(--green-soft); color: var(--green); }
    .failed { background: var(--red-soft); color: var(--red); }
    .skipped, .pending, .todo { background: var(--amber-soft); color: var(--amber); }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th, td {
      padding: 13px 16px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: .06em;
      text-transform: uppercase;
      background: #f9fbff;
    }

    td span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
    }

    pre {
      margin: 0;
      overflow-x: auto;
      border-radius: 10px;
      background: #111827;
      color: #f8fafc;
      padding: 14px;
      white-space: pre-wrap;
    }

    @media (max-width: 820px) {
      header {
        display: block;
      }

      .result-pill {
        margin-top: 16px;
      }

      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .file-card {
        align-items: flex-start;
        flex-direction: column;
      }

      table {
        min-width: 760px;
      }

      .table-wrap {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Vitest Report</h1>
        <p class="subtitle">Generated ${escapeHtml(generatedAt)} from the local unit test suite.</p>
      </div>
      <div class="result-pill">${report.success ? "All tests passed" : "Tests need attention"}</div>
    </header>

    <section class="summary">
      <div class="metric"><span>Total Tests</span><strong>${report.numTotalTests ?? rows.length}</strong></div>
      <div class="metric"><span>Passed</span><strong>${report.numPassedTests ?? 0}</strong></div>
      <div class="metric"><span>Failed</span><strong>${report.numFailedTests ?? 0}</strong></div>
      <div class="metric"><span>Duration</span><strong>${formatMs(totalDuration)}</strong></div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <h2>Test Files</h2>
          <p>${files.length} files executed by Vitest.</p>
        </div>
      </div>
      <div class="file-list">${fileCards}</div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <h2>Test Cases</h2>
          <p>Detailed case list with suite, file, status, and duration.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Test</th>
              <th>File</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>${testRows}</tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function formatMs(value) {
  if (!Number.isFinite(value)) return "0ms";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.max(0, value).toFixed(0)}ms`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
