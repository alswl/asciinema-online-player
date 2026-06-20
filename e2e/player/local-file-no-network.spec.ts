import { test } from "@playwright/test";
import { noOutboundRequests } from "./helpers";

test("no outbound requests for file content after local file selection", async ({
  page,
}) => {
  await noOutboundRequests(page);
});
