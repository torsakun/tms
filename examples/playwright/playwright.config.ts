import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: [
    ["list"],
    ["./tms-reporter.ts"]
  ],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
