// Regenerates docs/test-case-catalog.md by scanning all test files and
// extracting their describe()/it()/test() titles.
//
// Run: node scripts/build-test-catalog.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const GROUPS = [
  { level: "Unit", dir: "tests/unit", ext: ".test.ts" },
  { level: "Integration", dir: "tests/integration", ext: ".test.ts" },
  { level: "System (E2E legacy)", dir: "tests/system", ext: ".spec.ts" },
  { level: "UI E2E (Playwright)", dir: "e2e", ext: ".spec.ts" },
];

const COVERAGE = {
  Unit: "API routes, lib utilities — logic ราย function (mock DB/auth)",
  Integration: "API หลาย layer ทำงานร่วมกัน",
  "System (E2E legacy)": "End-to-end เดิม",
  "UI E2E (Playwright)": "คลิกหน้าจอจริง (Auth + Core CRUD)",
};

function extract() {
  const out = {};
  for (const g of GROUPS) {
    let files = [];
    try { files = readdirSync(g.dir).filter((f) => f.endsWith(g.ext)); } catch { continue; }
    out[g.level] = { dir: g.dir, files: {} };
    for (const f of files.sort()) {
      const src = readFileSync(`${g.dir}/${f}`, "utf8");
      const tests = [];
      let cur = "";
      for (const line of src.split("\n")) {
        const d = line.match(/describe\(\s*["'`](.+?)["'`]/);
        if (d) cur = d[1];
        const t = line.match(/\b(?:it|test)(?:\.\w+)?\(\s*["'`](.+?)["'`]/);
        if (t) tests.push({ describe: cur, title: t[1], skip: /\.(skip|fixme)\(/.test(line) });
      }
      if (tests.length) out[g.level].files[f] = tests;
    }
  }
  return out;
}

const nice = (f) =>
  f.replace(/\.(test|spec)\.ts$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function build(data) {
  let md = `# QMaster — Test Case Catalog\n\n`;
  md += `เอกสารนี้รวบรวม **test case ทั้งหมด** ในโปรเจกต์ QMaster โดยอัตโนมัติจากไฟล์ test จริง\n`;
  md += `(สร้างจาก \`scripts/build-test-catalog.mjs\` — regenerate ได้เมื่อ test เปลี่ยน)\n\n`;

  let grand = 0, skipped = 0;
  const counts = {};
  for (const level in data) {
    let n = 0;
    for (const f in data[level].files) { n += data[level].files[f].length; skipped += data[level].files[f].filter((t) => t.skip).length; }
    counts[level] = n; grand += n;
  }

  md += `## สรุป\n\n| ระดับ | จำนวน test | ครอบคลุม |\n|---|---|---|\n`;
  for (const level in counts) md += `| ${level} | ${counts[level]} | ${COVERAGE[level] || ""} |\n`;
  md += `| **รวม** | **${grand}** (${skipped} skipped) | |\n\n---\n\n`;

  let idx = 0;
  for (const level in data) {
    md += `## ${level}\n\n`;
    for (const f of Object.keys(data[level].files).sort()) {
      md += `### ${nice(f)}\n\n\`${data[level].dir}/${f}\`\n\n`;
      md += `| # | Scenario | Test case | Status |\n|---|---|---|---|\n`;
      for (const t of data[level].files[f]) {
        idx++;
        md += `| ${idx} | ${t.describe || "—"} | ${t.title.replace(/\|/g, "\\|")} | ${t.skip ? "⏭️ skip" : "✅ active"} |\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }

  md += `## หมายเหตุ\n\n`;
  md += `- **✅ active** = รันจริงทุกครั้ง\n`;
  md += `- **⏭️ skip** = ถูก mark \`skip\`/\`fixme\`\n`;
  md += `- Unit tests ใช้ mock (ไม่แตะ DB จริง) — รันเร็ว แยก logic\n`;
  md += `- UI E2E ใช้ Playwright คลิกหน้าจอจริง + ส่งผลกลับ QMaster ผ่าน reporter\n`;
  return md;
}

const md = build(extract());
writeFileSync("docs/test-case-catalog.md", md);
console.log("Wrote docs/test-case-catalog.md");
