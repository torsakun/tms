import { test, expect } from "@playwright/test";

test.describe("Projects", () => {
  test("QMS-03 create a new project", async ({ page }) => {
    // Unique code per run so re-runs don't collide on the unique project code
    const suffix = `${Date.now()}`.slice(-4);
    const name = `E2E Demo ${suffix}`;
    const code = `E${suffix}`;

    await page.goto("/projects");
    await page.getByRole("link", { name: /New project/i }).click();

    await page.getByPlaceholder("For example: Web Application").fill(name);
    await page.getByPlaceholder("For example: WA").fill(code);
    await page.getByPlaceholder(/Write a few sentences/i).fill("Created by Playwright e2e");

    await page.getByRole("button", { name: "Create project" }).click();

    // Back on the projects list, the new project should be visible
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });

  test("QMS-04 open a project and see its test cases", async ({ page }) => {
    await page.goto("/projects");
    await page.getByText("QMaster Self-Test").click();

    // Land on the project; go to the case repository
    await page.waitForURL(/\/projects\/QMS/, { timeout: 10_000 });
    await page.goto("/projects/QMS/repository", { waitUntil: "networkidle" });

    // The suite that holds the UI cases is always rendered
    await expect(page.getByText("UI Test Suite")).toBeVisible({ timeout: 10_000 });
    // And at least one seeded case is listed
    await expect(page.getByText("Login with valid credentials").first()).toBeVisible({ timeout: 10_000 });
  });
});
