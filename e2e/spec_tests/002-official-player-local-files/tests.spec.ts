/**
 * Spec: Official Player + Local File Only
 *
 * References tests from:
 *   e2e/player/ (module under test)
 *   src/components/player.test.tsx (unit test)
 */
import { test } from "@playwright/test";
import {
  errorRecovery,
  noOutboundRequests,
  showsOpenLocalFileButton,
  urlParameterIsIgnored,
  worksOffline,
} from "../../player/helpers";

test.describe("US1 — Full-fidelity terminal playback", () => {
  test("shows Open local file button", async ({ page }) => {
    await showsOpenLocalFileButton(page);
  });
});

test.describe("US2 — Privacy / no network", () => {
  test("silently ignores ?url= parameter", async ({ page }) => {
    await urlParameterIsIgnored(page);
  });

  test("zero outbound requests for file content", async ({ page }) => {
    await noOutboundRequests(page);
  });

  test("offline playback works", async ({ page, context }) => {
    await worksOffline(page, context);
  });
});

test.describe("US3 — Invalid input recovery", () => {
  test("shows error for invalid file, recovers with valid file", async ({
    page,
  }) => {
    await errorRecovery(page);
  });
});
