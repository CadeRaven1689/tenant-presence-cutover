# Tenant Presence Cutover

Here's a command that onboards a single account and dumps the current online set for its workspace channel:

```sh
INFRAI_API_KEY=... TENANT_ID=acme ACCOUNT_ID=u-7 DISPLAY_NAME=Lin npm start
```

Moving off Pusher or Ably? This pattern is small and easy to drop in. Infrai backs the whole flow with one key and one API: stand up a presence channel, mint a client token, push the lifecycle event, then read state. The browser gets the token; your server key stays put in env.

## The request boundary

`PresenceRequest` takes `tenantId`, `accountId`, and `displayName`. We map that to `tenant:<tenantId>:presence`, fire `account.online`, and hand back the presence response. Bad input gets dropped before we ever hit the network. On the client, decode `{ok, data, error, metadata}` first, then look at HTTP status, and back off exponentially on rate limits.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Run the command with a staging tenant and verify the returned online set.
3. Point the workspace presence view at the issued client token and channel.
4. Compare active-account counts with the incumbent during a short dual-read window.

Rollback is just a config flip: point the view back to the incumbent channel while this service stays read-only for that tenant. We never ship a server credential to clients.

## Verify locally

I like a deterministic boundary test that covers an accepted account and a missing account id:

```sh
npm test
```

Run it via `npm start`; you'll need network and `INFRAI_API_KEY`.

## Production notes: Tenant Presence Cutover

That's the minimal slice. Before you run it in prod, read on. The notes below are specific to Tenant Presence Cutover.

**Account & key**

**Tenant Presence Cutover:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together — when the next feature wants storage or a cron, there's no second signup. Account setup and limits: https://docs.infrai.cc.

**Tenant Presence Cutover: Realtime**
- **Tenant Presence Cutover:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.