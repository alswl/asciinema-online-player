import { type BrowserContext, expect, type Page } from "@playwright/test";
import path from "path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

/** Open the app, verify the "Open local file" UI is present. */
export async function showsOpenLocalFileButton(page: Page) {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Asciinema Online Player");
  await expect(
    page.locator("button", { hasText: "Open local file" }),
  ).toBeVisible();
  await expect(page.locator('input[type="url"]')).toHaveCount(0);
  await expect(page.locator("text=Pick a local")).toBeVisible();
}

/** Visiting /?url=anything shows the same empty state — parameter is ignored. */
export async function urlParameterIsIgnored(page: Page) {
  await page.goto("/?url=https://example.com/some.cast");
  await expect(
    page.locator("button", { hasText: "Open local file" }),
  ).toBeVisible();
  await expect(page.locator("text=Pick a local")).toBeVisible();
}

/** Selecting a local cast file triggers zero outbound requests. */
export async function noOutboundRequests(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const outgoing: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    const origin = page.url().split("/").slice(0, 3).join("/");
    if (url.includes(".cast") || !url.startsWith(origin)) {
      outgoing.push(url);
    }
  });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.resolve(FIXTURES, "sample.cast"));
  await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });
  expect(outgoing).toHaveLength(0);
}

/** Playback works offline after initial page load caches assets. */
export async function worksOffline(page: Page, context: BrowserContext) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);

  await expect(
    page.locator("button", { hasText: "Open local file" }),
  ).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.resolve(FIXTURES, "sample.cast"));
  await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });
}

/** Invalid file shows error banner; picking a valid file recovers. */
export async function errorRecovery(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const fileInput = page.locator('input[type="file"]');

  // Invalid file
  await fileInput.setInputFiles(path.resolve(FIXTURES, "not-a-cast.txt"));
  await expect(page.locator(".border-rose-700")).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.locator("button", { hasText: "Open local file" }),
  ).toBeEnabled();

  // Valid file recovers
  await fileInput.setInputFiles(path.resolve(FIXTURES, "sample.cast"));
  await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".border-rose-700")).toHaveCount(0);
}
