import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

const password = "password123";
const adminUser = { email: "admin@example.com", name: "Admin User" };

test.describe("test case code badge", () => {
  test("code badge is visible in repository view after creating a case", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);

    const project = uniqueProject("badge");
    await createProject(page, project);
    const suite = await createSuite(page, project.code, `Suite ${project.code}`);
    await createTestCase(page, project.code, suite.id, `Case ${project.code}`);

    await page.goto(`/projects/${project.code}/repository`);

    await expect(page.getByText(`${project.code}-001`)).toBeVisible();
  });

  test("code badge matches format PROJECT_CODE-NNN", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);

    const project = uniqueProject("format");
    await createProject(page, project);
    const suite = await createSuite(page, project.code, `Suite ${project.code}`);
    await createTestCase(page, project.code, suite.id, `Case ${project.code}`);

    await page.goto(`/projects/${project.code}/repository`);

    const badge = page.getByText(new RegExp(`^${project.code}-\\d{3}$`)).first();
    await expect(badge).toBeVisible();
  });

  test("second case receives incremented code badge -002", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);

    const project = uniqueProject("incr");
    await createProject(page, project);
    const suite = await createSuite(page, project.code, `Suite ${project.code}`);
    await createTestCase(page, project.code, suite.id, `Case A ${project.code}`);
    await createTestCase(page, project.code, suite.id, `Case B ${project.code}`);

    await page.goto(`/projects/${project.code}/repository`);

    await expect(page.getByText(`${project.code}-001`)).toBeVisible();
    await expect(page.getByText(`${project.code}-002`)).toBeVisible();
  });

  test("code is shown in test run execution view", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);

    const project = uniqueProject("run");
    await createProject(page, project);
    const suite = await createSuite(page, project.code, `Suite ${project.code}`);
    const tc = await createTestCase(page, project.code, suite.id, `Run Case ${project.code}`);

    // Create a test run with this case
    const runRes = await page.request.post(`/api/projects/${project.code}/runs`, {
      data: {
        title: `Run ${project.code}`,
        caseIds: [tc.id],
      },
    });
    expect(runRes.status()).toBe(201);
    const run = await runRes.json();

    await page.goto(`/projects/${project.code}/runs/${run.id}`);

    await expect(page.getByText(`${project.code}-001`)).toBeVisible();
  });

  test("code badge persists after page refresh", async ({ page, request }) => {
    await ensureAdmin(request);
    await signIn(page, adminUser.email);

    const project = uniqueProject("refresh");
    await createProject(page, project);
    const suite = await createSuite(page, project.code, `Suite ${project.code}`);
    await createTestCase(page, project.code, suite.id, `Refresh Case ${project.code}`);

    await page.goto(`/projects/${project.code}/repository`);
    await expect(page.getByText(`${project.code}-001`)).toBeVisible();

    await page.reload();
    await expect(page.getByText(`${project.code}-001`)).toBeVisible();
  });
});

// --- helpers ---

function uniqueProject(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return { name: `TC Code ${prefix} ${suffix}`, code: `T${suffix}` };
}

async function ensureAdmin(request: APIRequestContext) {
  const response = await request.get("/api/setup?secret=socket9");
  expect(response.ok()).toBeTruthy();
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in to Workspace" }).click();
  await expect(page.getByRole("heading", { name: "Quality Assurance Dashboard" })).toBeVisible();
}

async function createProject(page: Page, project: { name: string; code: string }) {
  const res = await page.request.post("/api/projects", {
    data: { name: project.name, code: project.code, description: "Created by test-case-code spec" },
  });
  expect(res.status()).toBe(201);
}

async function createSuite(page: Page, projectCode: string, title: string) {
  const res = await page.request.post(`/api/projects/${projectCode}/suites`, {
    data: { title, description: "Created by test-case-code spec" },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function createTestCase(page: Page, projectCode: string, suiteId: string, title: string) {
  const res = await page.request.post(`/api/projects/${projectCode}/cases`, {
    data: {
      title,
      suiteId,
      severity: "NORMAL",
      priority: "MEDIUM",
      automationStatus: "MANUAL",
      steps: [{ action: "Open the app", expectedResult: "App loads", position: 0 }],
    },
  });
  expect(res.status()).toBe(201);
  return res.json();
}
