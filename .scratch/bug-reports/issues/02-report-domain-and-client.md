# 02 - Report domain and client

Status: done
Blocked by: 01

Spec: [spec.md](../spec.md)

## What

A `src/bugReports/` module, no UI:

- Pure rules: payload type, limits (500-character reply, 4,000-character description, 2 MB compressed City, capture size), gzip + base64 of a City (`CompressionStream`, with a fallback in tests), technical context collection (version, user agent, screen, GPU, recent console errors via a small ring buffer installed at start).
- `BugReportClient` interface with a Supabase implementation (`supabaseBugReportClient.ts`, lazily loaded like the social client) and a fake one for tests and E2E.
- Typed errors mapped from the database (`urb_email_required`, `urb_rate_limited`, closed thread).

## Done when

Unit tests cover the limits, the gzip round trip, the error mapping and the console ring buffer; typecheck and lint pass.
