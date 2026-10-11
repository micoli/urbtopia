# Social client

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

`SocialClient` interface and its Supabase implementation in `src/social/`, loaded lazily like `CloudSaveClient`, plus a fake client for tests and regenerated database types.

## Acceptance criteria

- [ ] `SocialClient` covers every RPC of issue 01 with typed results and typed errors (rate limit with remaining delay, cap reached, Handle taken, change too soon).
- [ ] `supabase-js` loaded through dynamic `import()`; offline or unconfigured Supabase leaves the game playable and the Friends tab disabled.
- [ ] Fake client implementing the same rules for UI tests.
- [ ] `database.types.ts` regenerated and CI type check passes.
- [ ] `src/core` untouched; unit tests with vitest.
