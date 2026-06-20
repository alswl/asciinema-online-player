import { test } from "@playwright/test";
import { errorRecovery } from "./helpers";

test("shows error for invalid file and recovers with valid file", async ({
  page,
}) => {
  await errorRecovery(page);
});
