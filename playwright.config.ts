import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/asciinema-online-player/",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3000/asciinema-online-player/",
  },
});
