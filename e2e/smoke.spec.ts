import { expect, test } from "@playwright/test";

const SIMPLE_CAST = [
  '{"version": 2, "width": 80, "height": 24}',
  '[2, "o", "hello\\r\\n"]',
  '[3, "o", "hello\\r\\n"]',
  '[3.000001, "o", "hello\\r\\n"]',
  '[3.000002, "o", "hello\\r\\n"]',
  '[6, "o", "hello\\r\\n"]',
  '[7, "o", "hello\\r\\n"]',
  '[8, "o", "hello\\r\\n"]',
  '[9, "o", "hello\\r\\n"]',
  '[10, "o", "hello\\r\\n"]',
  '[11, "o", "hello\\r\\n"]',
  '[12, "o", "hello\\r\\n"]',
].join("\n");

function mockCastRoute(page: Parameters<Parameters<typeof test>[1]>[0]["page"], path: string) {
  return page.route(`**${path}`, (route) =>
    route.fulfill({ body: SIMPLE_CAST, headers: { "content-type": "text/plain" } }),
  );
}

test("page loads and shows player UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("Asciinema Online Player");
  await expect(page.locator('input[aria-label="asciinema cast URL"]')).toBeVisible();
  await expect(page.locator("pre")).toContainText("等待播放输出...");
});

test("loads asciinema simple.cast and shows metadata", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=asciicast v2 · 80x24 · 11 output events")).toBeVisible();
});

test("play and pause toggle", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=asciicast v2 · 80x24")).toBeVisible();

  // Click play
  await page.locator("button", { hasText: "播放" }).click();
  await expect(page.locator("button", { hasText: "暂停" })).toBeVisible();

  // Click pause
  await page.locator("button", { hasText: "暂停" }).click();
  await expect(page.locator("button", { hasText: "播放" })).toBeVisible();
});

test("playback outputs terminal text", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=asciicast v2 · 80x24")).toBeVisible();

  await page.locator("button", { hasText: "播放" }).click();

  // Verify "hello" appears in terminal output
  await expect(page.locator("pre")).toContainText("hello", { timeout: 5000 });
});

test("progress bar advances during playback", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=asciicast v2")).toBeVisible();

  await page.locator("button", { hasText: "播放" }).click();

  // Progress bar should move from 0%
  const progressBar = page.locator(".h-full.bg-teal-400");
  await expect(progressBar).toBeVisible();

  // After 3 real seconds, playback time should be > 2s (cast starts at t=2)
  await page.waitForTimeout(3000);
  const width = await progressBar.evaluate((el) => (el as HTMLElement).style.width);
  const pct = parseFloat(width);
  expect(pct).toBeGreaterThan(0);
});

test("shows error for invalid URL", async ({ page }) => {
  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("https://invalid.example/cast");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=请求失败")).toBeVisible();
});

test("loads from ?url= query parameter", async ({ page }) => {
  await mockCastRoute(page, "/query.cast");

  await page.goto("/?url=%2Fquery.cast");

  await expect(page.locator("text=asciicast v2 · 80x24 · 11 output events")).toBeVisible();
});
