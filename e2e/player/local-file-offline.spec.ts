import { test } from "@playwright/test";
import { worksOffline } from "./helpers";

test("player works offline after cached assets", async ({ page, context }) => {
  await worksOffline(page, context);
});
