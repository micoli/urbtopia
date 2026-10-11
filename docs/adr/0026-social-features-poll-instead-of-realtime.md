# Social features poll Supabase instead of using Realtime or SSE

Accepted.

Friend requests, the friend list and, later, messages and Trade offers are read by polling RPC functions through a `SocialClient` interface, in the spirit of `CloudSaveClient` (ADR 0015). `supabase-js` stays behind a dynamic `import()` so solo players never pay for it. The client polls every 15 s while the Friends or Messages panel is open, and every 60 s for the notification badge while it is closed. Polling stops while the tab is hidden (`visibilitychange`).

Supabase offers no Server-Sent Events. Its Realtime service (Broadcast, Presence, Postgres Changes) runs over WebSockets, and its own documentation says delivery of every message is not guaranteed.

## Why

- A poll over plain HTTPS works wherever the app works, needs no long-lived connection, and has no concurrent-connection quota to manage.
- Realtime cannot be the source of truth anyway: missed messages must be recovered by a query, so the poll has to exist regardless.
- Latency of a few seconds is acceptable for a friend list, a mailbox and Trade offers.

## Consequences

- Every read is a rate-limit candidate: polling RPCs must be cheap, indexed, and return only what changed since a cursor.
- If latency starts to matter, Realtime can be added as an accelerator that only triggers an immediate poll. The poll stays the source of truth and this ADR stays valid.
- Each open client costs one request per 15 s at most; revisit the intervals if the free-tier request budget is approached.
