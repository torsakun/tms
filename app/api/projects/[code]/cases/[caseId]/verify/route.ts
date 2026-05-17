import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string, caseId: string }> }
) {
  const { code, caseId } = await params;
  try {
    const body = await req.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    // Wrap the script in a test block if it isn't already
    const isWrapped = script.includes('test(');
    let finalScript = isWrapped 
      ? script 
      : `import { test, expect } from '@playwright/test';\n\ntest('Automated Test Case', async ({ page }) => {\n${script}\n});`;

    // Inject global test.afterEach to capture DOM on failure
    const afterEachHook = `
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log("=== AUTOCAPTURE_DOM_START ===");
    try {
      const html = await page.content();
      console.log(html);
    } catch (e: any) {
      console.log("Could not capture DOM: " + e.message);
    }
    console.log("=== AUTOCAPTURE_DOM_END ===");
  }
});
`;

    // Make sure we only inject it once and import test if needed
    if (!finalScript.includes('=== AUTOCAPTURE_DOM_START ===')) {
      if (!finalScript.includes("import { test")) {
        finalScript = `import { test, expect } from '@playwright/test';\n` + finalScript;
      }
      // Insert hook right after imports
      finalScript = finalScript.replace(/(import.*['"]@playwright\/test['"];?)/, `$1\n${afterEachHook}`);
    }

    // Write to a temporary file
    const tmpDir = os.tmpdir();
    const filename = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}.spec.ts`;
    const filepath = path.join(tmpDir, filename);

    fs.writeFileSync(filepath, finalScript, "utf8");

    // Execute Playwright
    let stdout = "";
    let stderr = "";
    let passed = false;

    try {
      const result = await execPromise(`playwright test ${filename} --browser=chromium --reporter=list --output=/tmp/test-results`, {
        cwd: tmpDir,
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright', HOME: '/home/nextjs', NODE_PATH: '/usr/local/lib/node_modules' }
      });
      stdout = result.stdout;
      stderr = result.stderr;
      passed = true;
    } catch (err: any) {
      // execPromise throws if exit code is not 0
      stdout = err.stdout || "";
      stderr = err.stderr || err.message || "";
      passed = false;
    }

    // Clean up
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      console.error("Failed to delete tmp file:", e);
    }

    // Extract failed DOM context if present
    let failedDomContext = null;
    const domStartMatch = stdout.match(/=== AUTOCAPTURE_DOM_START ===\n([\s\S]*?)\n=== AUTOCAPTURE_DOM_END ===/);
    if (domStartMatch && domStartMatch[1]) {
      failedDomContext = domStartMatch[1];
      // Clean up stdout so we don't bloat the logs UI
      stdout = stdout.replace(/=== AUTOCAPTURE_DOM_START ===\n[\s\S]*?\n=== AUTOCAPTURE_DOM_END ===\n?/, '');
    }

    // Prepare logs
    const logs = `--- PLAYWRIGHT VERIFICATION LOGS ---\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    
    // Save to the TestCase so user doesn't lose the log
    await prisma.testCase.update({
      where: { id: caseId },
      data: {
        lastVerificationLog: logs
      }
    });

    return NextResponse.json({ 
      success: true, 
      passed, 
      logs,
      failedDomContext
    });

  } catch (error: any) {
    console.error("Script verification failed:", error);
    return NextResponse.json({ error: error.message || "Failed to verify script" }, { status: 500 });
  }
}
