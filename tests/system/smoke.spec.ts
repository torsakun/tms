import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

const password = "password123";
const adminUser = {
  email: "admin@example.com",
  name: "Admin User"
};

test.describe("TMS smoke tests", () => {
  test("redirects unauthenticated users from dashboard to login", async ({ page }) => {
    await page.goto("/dashboards");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("signs up a new user and opens the global dashboard", async ({ page }) => {
    const user = uniqueUser("signup");

    await page.goto("/signup");
    await page.getByPlaceholder("John Doe").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page).toHaveURL(/\/dashboards|\/$/);
    await expect(page.getByRole("heading", { name: "Quality Assurance Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Test Cases")).toBeVisible();
  });

  test("signs in and opens the projects page", async ({ page, request }) => {
    const user = uniqueUser("projects");
    await registerUser(request, user);

    await signIn(page, user.email);
    await page.goto("/projects");

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("creates a project from the projects UI and reads it in the list", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);
    const project = uniqueProject("crudui");

    await page.goto("/projects?create=true");
    await expect(page.getByRole("heading", { name: "Create new project" })).toBeVisible();
    await page.getByPlaceholder("For example: Web Application").fill(project.name);
    await page.getByPlaceholder("For example: WA").fill(project.code);
    await page.getByPlaceholder("Write a few sentences about your project").fill("Created by Playwright smoke test.");
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText(project.name)).toBeVisible();
    await page.getByLabel("Search projects").fill(project.code);
    await expect(page.getByText(project.name)).toBeVisible();
  });

  test("creates a suite and test case through APIs, then reads them in repository UI", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);
    const project = uniqueProject("crudapi");
    const suiteTitle = `Smoke Suite ${project.code}`;
    const caseTitle = `Smoke Case ${project.code}`;

    await createProject(page, project);
    const suite = await createSuite(page, project.code, suiteTitle);
    await createTestCase(page, project.code, suite.id, caseTitle);

    await page.goto(`/projects/${project.code}/repository`);
    await expect(page.getByText(suiteTitle).first()).toBeVisible();
    await expect(page.getByText(caseTitle)).toBeVisible();
  });
});

function uniqueUser(prefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `Smoke ${prefix}`,
    email: `smoke-${prefix}-${suffix}@example.com`
  };
}

function uniqueProject(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return {
    name: `Smoke ${prefix} ${suffix}`,
    code: `S${suffix}`
  };
}

async function ensureAdmin(request: APIRequestContext) {
  const response = await request.get("/api/setup?secret=socket9");
  expect(response.ok()).toBeTruthy();
}

async function registerUser(request: APIRequestContext, user: { name: string; email: string }) {
  const response = await request.post("/api/auth/register", {
    data: {
      name: user.name,
      email: user.email,
      password
    }
  });

  expect(response.status()).toBe(201);
}

async function createProject(page: Page, project: { name: string; code: string }) {
  const response = await page.request.post("/api/projects", {
    data: {
      name: project.name,
      code: project.code,
      description: "Created by Playwright smoke test."
    }
  });

  expect(response.status()).toBe(201);
}

async function createSuite(page: Page, projectCode: string, title: string) {
  const response = await page.request.post(`/api/projects/${projectCode}/suites`, {
    data: {
      title,
      description: "Created by Playwright smoke test."
    }
  });

  expect(response.status()).toBe(201);
  return response.json();
}

async function createTestCase(page: Page, projectCode: string, suiteId: string, title: string) {
  const response = await page.request.post(`/api/projects/${projectCode}/cases`, {
    data: {
      title,
      suiteId,
      description: "Created by Playwright smoke test.",
      severity: "NORMAL",
      priority: "MEDIUM",
      automationStatus: "MANUAL",
      tags: ["smoke"],
      steps: [
        {
          action: "Open the project repository",
          expectedResult: "The test case is visible",
          position: 0
        }
      ],
      customFields: {}
    }
  });

  expect(response.status()).toBe(201);
  return response.json();
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in to Workspace" }).click();
  await expect(page.getByRole("heading", { name: "Quality Assurance Dashboard" })).toBeVisible();
}
