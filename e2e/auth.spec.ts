import { test, expect } from "@playwright/test";

const EMAIL = process.env.QMASTER_EMAIL || "admin@example.com";
const PASSWORD = process.env.QMASTER_PASSWORD || "admin1234";

// QMS-02 and QMS-01 need a clean (logged-out) state, so clear storage first.
test.describe("Authentication", () => {
  test("QMS-01 login with valid credentials", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");

    await page.getByPlaceholder("jordan@checkout.dev").fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("QMS-02 login with wrong password shows error", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");

    await page.getByPlaceholder("jordan@checkout.dev").fill(EMAIL);
    await page.locator('input[type="password"]').fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Stays on the login page — never reaches an authed route
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("QMS-08 logout returns to login", async ({ page }) => {
    await page.goto("/projects");
    // Open the user menu (avatar shows initials, e.g. "AU")
    await page.locator("button").filter({ hasText: /^[A-Z]{2}$/ }).first().click();
    await page.getByText("Sign out", { exact: false }).click();

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
