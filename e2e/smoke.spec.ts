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
  await expect(page.locator("button", { hasText: "播放" })).toBeDisabled();
});

test("loads asciinema simple.cast and shows metadata", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button:has-text("加载录屏")').click();

  await expect(page.locator("text=asciicast v2 · 80x24 · 11 output events")).toBeVisible();
});

test("play and pause toggle", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button:has-text("加载录屏")').click();

  await expect(page.locator("text=asciicast v2")).toBeVisible();

  await page.locator("button", { hasText: "播放" }).click();
  await expect(page.locator("button", { hasText: "暂停" })).toBeVisible();

  await page.locator("button", { hasText: "暂停" }).click();
  await expect(page.locator("button", { hasText: "播放" })).toBeVisible();
});

test("playback outputs terminal text", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button:has-text("加载录屏")').click();

  await expect(page.locator("text=asciicast v2")).toBeVisible();

  await page.locator("button", { hasText: "播放" }).click();
  await expect(page.locator("pre")).toContainText("hello", { timeout: 15000 });
});

test("progress bar advances during playback", async ({ page }) => {
  await mockCastRoute(page, "/simple.cast");

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/simple.cast");
  await page.locator('button:has-text("加载录屏")').click();

  await expect(page.locator("text=asciicast v2")).toBeVisible();

  await page.locator("button", { hasText: "播放" }).click();

  // The progress bar is inside an 1px height div; check its parent
  const progressWrapper = page.locator(".h-1.bg-slate-800");
  await expect(progressWrapper).toBeVisible();

  await page.waitForTimeout(3000);
  const progressFill = progressWrapper.locator(".h-full.bg-teal-400");
  const width = await progressFill.evaluate((el) => (el as HTMLElement).style.width);
  expect(parseFloat(width)).toBeGreaterThan(0);
});

test("shows error for unreachable URL", async ({ page }) => {
  // Use route to simulate a network failure
  await page.route("**/error.cast", (route) => route.abort("failed"));

  await page.goto("/");

  await page.locator('input[aria-label="asciinema cast URL"]').fill("/error.cast");
  await page.locator('button:has-text("加载录屏")').click();

  // Network error shows either "加载失败" or the browser's error message
  await expect(page.locator(".border-rose-700")).toBeVisible({ timeout: 10000 });
});

test("loads from ?url= query parameter", async ({ page }) => {
  await mockCastRoute(page, "/query.cast");

  await page.goto("/?url=%2Fquery.cast");

  await expect(page.locator("text=asciicast v2 · 80x24 · 11 output events")).toBeVisible();
});
