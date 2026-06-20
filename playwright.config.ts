import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "docs/reports/artifacts",
  reporter: [
    ["html", { outputFolder: "docs/reports/002-official-player-local-files" }],
  ],
  webServer: {
    command: "npm run build && cd out && python3 -m http.server 3000",
    url: "http://localhost:3000/",
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://localhost:3000/",
    screenshot: "on",
    trace: "on-first-retry",
  },
  // Use system Chrome locally; CI installs bundled chromium via --with-deps
  projects: [
    {
      name: "local",
      use: { channel: "chrome" },
    },
  ],
});
