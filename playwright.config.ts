import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for QMaster UI (e2e) tests.
 * - Tests hit the running dev server at http://localhost:3000
 * - `setup` project logs in once and saves the session (storageState)
 *   so the real test specs start already authenticated.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["./e2e/qmaster-reporter.ts"]],
  timeout: 30_000,
  use: {
    baseURL: process.env.QMASTER_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // 1) auth setup — runs first, produces .auth/state.json
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // 2) the actual UI tests, reusing the saved login
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/state.json",
      },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
