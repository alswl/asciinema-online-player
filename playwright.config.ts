import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  webServer: {
    command: "npm run build && cd out && python3 -m http.server 3000",
    url: "http://localhost:3000/",
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://localhost:3000/",
  },
  // Use system Chrome locally; CI installs bundled chromium via --with-deps
  projects: [
    {
      name: "local",
      use: { channel: "chrome" },
    },
  ],
});
