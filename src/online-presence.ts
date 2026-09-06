import { z } from "zod";
import { InfraiClient } from "./infrai-client.js";

export const PresenceRequest = z.object({ tenantId: z.string().min(1), accountId: z.string().min(1), displayName: z.string().min(1) });
export type PresenceRequest = z.infer<typeof PresenceRequest>;

export async function onboardAndReadPresence(input: unknown, client = new InfraiClient()) {
  const request = PresenceRequest.parse(input);
  const channel = `tenant:${request.tenantId}:presence`;
  await client.createChannel(channel);
  await client.issueToken(request.accountId, [channel]);
  await client.publish(channel, "account.online", { display_name: request.displayName }, request.accountId);
  return client.presence(channel);
}

if (process.argv[1]?.endsWith("online-presence.ts")) {
  const input = { tenantId: process.env.TENANT_ID ?? "acme", accountId: process.env.ACCOUNT_ID ?? "operator-1", displayName: process.env.DISPLAY_NAME ?? "Operator" };
  onboardAndReadPresence(input).then((data) => console.log(JSON.stringify({ channel: `tenant:${input.tenantId}:presence`, online: data }, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
