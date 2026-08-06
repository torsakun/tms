import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const CREATE_TITLE_PH = "e.g., Apply promo code at checkout";
const EDIT_TITLE_PH = "e.g., User can complete checkout with Credit Card";

const caseMap = JSON.parse(
  readFileSync(path.join(__dirname, "case-map.json"), "utf8"),
);

// Resolve the QMS suite id via the app API (shares the authed session)
async function firstSuiteId(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/projects/QMS/suites");
  const data = await res.json();
  const suites = Array.isArray(data) ? data : data.suites;
  return suites[0].id as string;
}

test.describe("Test Cases", () => {
  test("QMS-05 create a new test case", async ({ page }) => {
    const title = `E2E — verify checkout ${`${Date.now()}`.slice(-4)}`;
    const suiteId = await firstSuiteId(page.request);

    // Creating a case requires a suite — pass it via the query param the form reads
    await page.goto(`/projects/QMS/cases/create?suite=${suiteId}`);

    await page.getByPlaceholder(CREATE_TITLE_PH).fill(title);
    // The form ships with an empty step row whose "Action" is required —
    // fill it so react-hook-form lets the submit through.
    const action = page.getByPlaceholder("Action...");
    if (await action.count()) await action.first().fill("Open the app");

    await page.getByRole("button", { name: "Save case" }).click();

    await page.waitForURL((url) => !url.pathname.endsWith("/cases/create"), { timeout: 10_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });

  // KNOWN ISSUE (found by this E2E test): on the edit-case page, clicking
  // "Save Changes" does NOT fire a PATCH to /api/cases/[id] and the page
  // navigates to an unrelated case id. No validation error is shown.
  // Marked fixme until the edit-page submit is fixed. See docs/ui-test-cases.md.
  test.fixme("QMS-06 edit an existing test case", async ({ page }) => {
    const caseId = caseMap.cases["QMS-01"].qmasterId;
    await page.goto(`/projects/QMS/cases/${caseId}/edit`);

    const updated = `Login valid creds (updated ${`${Date.now()}`.slice(-4)})`;
    await page.getByPlaceholder(EDIT_TITLE_PH).first().fill(updated);

    // Same as create: satisfy any required step row before saving
    const action = page.getByPlaceholder("Action...");
    if (await action.count()) await action.first().fill("Open the app");

    await page.getByRole("button", { name: "Save Changes" }).click();

    // On success the edit page redirects to the repository
    await page.waitForURL(/\/repository/, { timeout: 10_000 });
    await expect(page.getByText(updated)).toBeVisible({ timeout: 10_000 });
  });
});
