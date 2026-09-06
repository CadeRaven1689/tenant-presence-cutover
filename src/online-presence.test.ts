import test from "node:test";
import assert from "node:assert/strict";
import { PresenceRequest } from "./online-presence.js";

test("tenant presence input requires an account and display name", () => {
  const parsed = PresenceRequest.safeParse({ tenantId: "acme", accountId: "u-7", displayName: "Lin" });
  assert.equal(parsed.success, true);
  assert.equal(PresenceRequest.safeParse({ tenantId: "acme", accountId: "", displayName: "Lin" }).success, false);
});
