import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "test-output/artifacts",
  reporter: [
    ["html", { outputFolder: "test-output/003-optimize-user-experience" }],
  ],
  webServer: {
    command: "cd out && python3 -m http.server 3000",
    url: "http://localhost:3000/",
    reuseExistingServer: true,
    timeout: 15000,
  },
  use: {
    baseURL: "http://localhost:3000/",
    screenshot: "on",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
