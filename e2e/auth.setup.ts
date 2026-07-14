import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, ".auth/state.json");

const EMAIL = process.env.QMASTER_EMAIL || "admin@example.com";
const PASSWORD = process.env.QMASTER_PASSWORD || "admin1234";

/**
 * Logs in once via the real login form and saves the authenticated
 * session to disk. Every other spec reuses this state (see playwright.config.ts).
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.getByPlaceholder("jordan@checkout.dev").fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait until we leave the login page (redirect to dashboard/projects)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
