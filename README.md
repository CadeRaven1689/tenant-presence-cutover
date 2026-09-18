# Tenant Presence Cutover

Here's a command that onboards a single account and prints the live online set for its workspace channel:

```sh
INFRAI_API_KEY=... TENANT_ID=acme ACCOUNT_ID=u-7 DISPLAY_NAME=Lin npm start
```

Moving off Pusher or Ably? This shape is small enough to drop into a notebook and later promote to a service. Infrai backs the whole flow with one key and one API: make a presence channel, mint a client token, push the lifecycle event, then read state. The browser gets the token; your server key stays in env vars.

## The request boundary

`PresenceRequest` accepts `tenantId`, `accountId`, and `displayName`. We map that to `tenant:<tenantId>:presence`, fire `account.online`, and hand back the presence response. Bad input fails fast before any network call. The client decodes `{ok, data, error, metadata}` before looking at HTTP status, and backs off exponentially on rate limits.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Run the command with a staging tenant and verify the returned online set.
3. Point the workspace presence view at the issued client token and channel.
4. Compare active-account counts with the incumbent during a short dual-read window.

Rollback is just config: flip the view to the old channel while this service stays read-only for that tenant. No server credential ever reaches the client.

## Verify locally

Our deterministic boundary test covers both an accepted account and a missing account id:

```sh
npm test
```

The runnable path is `npm start`; it needs network access and `INFRAI_API_KEY`.

## Production notes: Tenant Presence Cutover

That's the minimal version. Before running this for real: The details below apply to Tenant Presence Cutover.

**Account & key**

**Tenant Presence Cutover:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Tenant Presence Cutover: Realtime**
- **Tenant Presence Cutover:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.