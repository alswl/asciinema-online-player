import { test } from "@playwright/test";
import { showsOpenLocalFileButton, urlParameterIsIgnored } from "./helpers";

test("page loads and shows the Open local file affordance", async ({
  page,
}) => {
  await showsOpenLocalFileButton(page);
});

test("?url= query parameter is silently ignored", async ({ page }) => {
  await urlParameterIsIgnored(page);
});
