import { test, expect } from "@playwright/test";

test.describe("Test Runs", () => {
  test("QMS-07 create a test run and select cases", async ({ page }) => {
    const title = `E2E Smoke Run ${`${Date.now()}`.slice(-4)}`;

    await page.goto("/projects/QMS/runs/create");

    // Run title is the first text input
    await page.locator('input[type="text"]').first().fill(title);

    // Narrow the case list via search, then select the case row
    const search = page.getByPlaceholder(/Search cases/i);
    if (await search.count()) await search.first().fill("Login with valid credentials");
    await page.waitForTimeout(500);

    const caseRow = page.getByText("Login with valid credentials").first();
    await caseRow.scrollIntoViewIfNeeded();
    await caseRow.click();

    await page.getByRole("button", { name: "Start run" }).click();

    // Run created — we leave the create page
    await page.waitForURL((url) => !url.pathname.endsWith("/runs/create"), { timeout: 10_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });
});
