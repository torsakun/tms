import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "coverage/unit",
    },
  },
});
