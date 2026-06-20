import { type BrowserContext, expect, type Page } from "@playwright/test";
import path from "path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

/** Path to a fixture file. */
export function fixturePath(name: string): string {
  return path.resolve(FIXTURES, name);
}

/** Select a local file via the hidden file input. */
export async function selectFile(page: Page, fixtureName: string) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(fixturePath(fixtureName));
}

/** Get the accessible file-picker button (on /play) or CTA link (on /). */
export function filePickerButton(page: Page) {
  return page.locator(
    'button:has-text("Open a .cast"), a:has-text("Open a .cast"), button:has-text("打开 .cast"), a:has-text("打开 .cast"), button:has-text("Replace"), button:has-text("更换")',
  );
}

/** Get the error alert region. */
export function errorAlert(page: Page) {
  return page.getByRole("alert");
}

/** Get the player wrapper element. */
export function playerWrapper(page: Page) {
  return page.locator(".ap-wrapper");
}

/** Get the loading status container. */
export function loadingStatus(page: Page) {
  return page.getByRole("status");
}

/** Open the app, wait for idle state. */
export async function openApp(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(filePickerButton(page)).toBeVisible();
}

/** Verify the privacy message is visible. */
export async function hasPrivacyMessage(page: Page) {
  await expect(
    page.getByText(/never uploaded|this device|不会上传/),
  ).toBeVisible();
}

// ── Retained helpers for existing regression tests ──

/** Open the app, verify the home page UI is present. */
export async function showsOpenLocalFileButton(page: Page) {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("asciinema");
  await expect(
    page.locator("a", { hasText: /Open a \.cast file/ }),
  ).toBeVisible();
  await expect(page.locator('input[type="url"]')).toHaveCount(0);
  await expect(
    page.getByText(/never uploaded|this device|不会上传/).first(),
  ).toBeVisible();
}

/** Visiting /?url=anything shows the same home page — parameter is ignored. */
export async function urlParameterIsIgnored(page: Page) {
  await page.goto("/?url=https://example.com/some.cast");
  await expect(
    page.locator("a", { hasText: /Open a \.cast file/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/never uploaded|this device|不会上传/).first(),
  ).toBeVisible();
}

/** Selecting a local cast file triggers zero outbound requests. */
export async function noOutboundRequests(page: Page) {
  await page.goto("/play");
  await page.waitForLoadState("networkidle");

  const outgoing: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    const origin = page.url().split("/").slice(0, 3).join("/");
    if (url.includes(".cast") || !url.startsWith(origin)) {
      outgoing.push(url);
    }
  });

  await selectFile(page, "sample.cast");
  await expect(playerWrapper(page)).toBeVisible({ timeout: 15000 });
  expect(outgoing).toHaveLength(0);
}

/** Playback works offline after initial page load caches assets. */
export async function worksOffline(page: Page, context: BrowserContext) {
  await page.goto("/play");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);

  await expect(
    page.locator("button", { hasText: /Open a .cast file/ }),
  ).toBeVisible();

  await selectFile(page, "sample.cast");
  await expect(playerWrapper(page)).toBeVisible({ timeout: 15000 });
}

/** Invalid file shows error banner; picking a valid file recovers. */
export async function errorRecovery(page: Page) {
  await page.goto("/play");
  await page.waitForLoadState("networkidle");

  // Invalid file — uses role="alert" for error detection
  await selectFile(page, "not-a-cast.txt");
  await expect(errorAlert(page)).toBeVisible({ timeout: 15000 });
  await expect(
    page.locator("button", { hasText: /Open a .cast file|打开 .cast 文件/ }),
  ).toBeEnabled();

  // Valid file recovers
  await selectFile(page, "sample.cast");
  await expect(playerWrapper(page)).toBeVisible({ timeout: 15000 });
  await expect(errorAlert(page)).toHaveCount(0);
}
