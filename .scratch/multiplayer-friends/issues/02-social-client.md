# Social client

Status: done - tsc, eslint, vitest and build pass
Blocked by: 01
Spec: ../spec.md

## What to build

`SocialClient` interface and its Supabase implementation in `src/social/`, loaded lazily like `CloudSaveClient`, plus a fake client for tests and regenerated database types.

## Acceptance criteria

- [x] `SocialClient` covers every RPC of issue 01 with typed results and typed errors (rate limit with remaining delay, cap reached, Handle taken, change too soon).
- [x] `supabase-js` loaded through dynamic `import()`; offline or unconfigured Supabase leaves the game playable and the Friends tab disabled.
- [x] Fake client implementing the same rules for UI tests.
- [x] `database.types.ts` regenerated and CI type check passes.
- [x] `src/core` untouched; unit tests with vitest.
