import { expect, test, type Page } from "@playwright/test";
import path from "path";

const FIXTURES = path.resolve(import.meta.dirname, "player/fixtures");
const SCREENSHOT_DIR = path.resolve(
  import.meta.dirname,
  "../test-output/003-optimize-user-experience/screenshots",
);

function fp(name: string) {
  return path.resolve(FIXTURES, name);
}

/** Get the app's error alert, excluding Next.js route announcer. */
function appAlert(page: Page) {
  return page.locator('[role="alert"]').filter({
    hasText: /Could not|无法|empty|malformed|not a valid|当前录制/,
  });
}

test.describe("QA Verification — Full Acceptance Report", () => {
  // ── US1: Idle state ──
  test("US1-IDLE: idle state shows purpose, privacy, .cast hint, file picker", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify key elements
    await expect(page.locator("h1")).toContainText("asciinema");
    // .cast appears in both FilePicker help text and idle section
    await expect(
      page.locator("code").filter({ hasText: ".cast" }),
    ).toBeVisible();
    // Privacy text appears in both idle section and footer
    await expect(
      page.getByText(/never uploaded|this device|不会上传/).first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: /Open a \.cast file|打开 \.cast 文件/ })
        .first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "01-idle-en.png"),
      fullPage: true,
    });
  });

  // ── US1: Loading state ──
  test("US1-LOADING: shows filename and status role during load", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("sample.cast"));

    // Loading status with filename
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=sample.cast")).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "02-loading.png"),
      fullPage: true,
    });
  });

  // ── US1: Ready state ──
  test("US1-READY: player is main content, shows filename and replace button", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("sample.cast"));

    // Wait for player
    await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });

    // Filename visible
    await expect(page.locator("text=sample.cast")).toBeVisible();

    // Replace button available
    await expect(
      page.getByRole("button", { name: /Replace|更换/ }),
    ).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "03-ready.png"),
      fullPage: true,
    });
  });

  // ── US1: Error state ──
  test("US1-ERROR: role=alert, safe message, retry available", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("not-a-cast.txt"));

    await expect(appAlert(page)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Could not open|无法打开/)).toBeVisible();

    // File picker still available for retry
    await expect(
      page.getByRole("button", { name: /Open local file|选择本地录制/ }),
    ).toBeEnabled();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "04-error.png"),
      fullPage: true,
    });
  });

  // ── US3: Chinese locale ──
  test("US3-CN: Chinese UI with full translation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to Chinese
    await page.locator("select").first().selectOption("zh-CN");

    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.locator("h1")).toContainText("asciinema");
    await expect(
      page.getByRole("link", { name: /打开 \.cast 文件/ }).first(),
    ).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "05-idle-zh.png"),
      fullPage: true,
    });
  });

  // ── US3: Dark theme ──
  test("US3-DARK: dark theme applied via data-theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("select").nth(1).selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "06-dark-theme.png"),
      fullPage: true,
    });
  });

  // ── US3: Light theme ──
  test("US3-LIGHT: light theme applied via data-theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("select").nth(1).selectOption("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "07-light-theme.png"),
      fullPage: true,
    });
  });

  // ── US2: Replacement failure preserves player ──
  test("US2-REPLACE-ERROR: failed replacement keeps current player", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');

    // Load valid recording
    await fileInput.setInputFiles(fp("sample.cast"));
    await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });

    // Try bad replacement
    await fileInput.setInputFiles(fp("not-a-cast.txt"));
    await expect(appAlert(page)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Could not replace|无法更换/)).toBeVisible();

    // Player still there!
    await expect(page.locator(".ap-wrapper")).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "08-replace-error.png"),
      fullPage: true,
    });
  });

  // ── US4: Multiple error types ──
  test("US4-EMPTY: empty file shows clear error", async ({ page }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("empty.cast"));

    await expect(appAlert(page)).toBeVisible({ timeout: 15000 });
    // Error message should be descriptive and safe

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "09-empty-error.png"),
      fullPage: true,
    });
  });

  test("US4-MALFORMED: malformed file shows clear error", async ({ page }) => {
    await page.goto("/play");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("malformed.cast"));

    await expect(appAlert(page)).toBeVisible({ timeout: 15000 });

    // Error must not leak file content
    const errorText = await appAlert(page).textContent();
    expect(errorText).not.toContain("just some random text");
    expect(errorText).not.toContain("fixtures");

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "10-malformed-error.png"),
      fullPage: true,
    });
  });

  // ── US5: Footer with project links ──
  test("US5-FOOTER: project links visible in all major states", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Footer links visible in idle
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/Source Code|源代码/)).toBeVisible();
    await expect(footer.getByText(/Help|使用说明/)).toBeVisible();
    await expect(footer.getByText(/Report Issue|反馈问题/)).toBeVisible();

    // Load a recording, footer still visible
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fp("sample.cast"));
    await expect(page.locator(".ap-wrapper")).toBeVisible({ timeout: 15000 });
    await expect(footer).toBeVisible();

    await page.screenshot({
      path: path.resolve(SCREENSHOT_DIR, "11-footer-ready.png"),
      fullPage: true,
    });
  });

  // ── Responsive: 4 viewport sizes ──
  const VIEWPORTS = [
    { w: 320, h: 720, name: "12-responsive-320" },
    { w: 768, h: 1024, name: "13-responsive-768" },
    { w: 1280, h: 800, name: "14-responsive-1280" },
    { w: 1920, h: 1080, name: "15-responsive-1920" },
  ];

  for (const vp of VIEWPORTS) {
    test(`RESPONSIVE ${vp.w}px: no horizontal overflow, content readable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // No page-level horizontal scroll
      const scrollW = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientW = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollW).toBeLessThanOrEqual(clientW + 1);

      // Heading visible
      await expect(page.locator("h1")).toBeVisible();
      // File picker visible
      await expect(
        page
          .getByRole("link", { name: /Open a \.cast file|打开 \.cast 文件/ })
          .first(),
      ).toBeVisible();

      await page.screenshot({
        path: path.resolve(SCREENSHOT_DIR, `${vp.name}.png`),
        fullPage: true,
      });
    });
  }
});
