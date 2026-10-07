# Cloud client and anonymous auth

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

`CloudSaveClient` in `src/persistence/cloud/`, implemented with `supabase-js` loaded by dynamic `import()`, creating the Player account silently on first use. Without configuration or network the game behaves exactly as today.

## Acceptance criteria

- [ ] `CloudSaveClient` interface: sign in anonymously, `push`, `list`, `restore`, `deleteMine`; typed errors (offline, conflict with server revision, too large, unauthenticated).
- [ ] In-memory fake implementation for tests, like `MemorySaveStore`.
- [ ] Real implementation reads `VITE_SUPABASE_URL` and the publishable key; absent config means cloud disabled, no import of `supabase-js`.
- [ ] `supabase-js` appears only in a lazy chunk; a test or build check shows the main bundle does not contain it.
- [ ] `src/core` imports nothing cloud-related (`coreIsolation.test.ts` still passes).
- [ ] Session persistence uses Supabase's storage; no token logged or written to the save envelope.
