import { expect, test } from "@playwright/test";

test("[LOGIN-001] homepage loads successfully", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle(/Example Domain/);
});

test("[LOGIN-002] failing example sends failed result", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page.locator("h1")).toHaveText("This text will fail");
});
