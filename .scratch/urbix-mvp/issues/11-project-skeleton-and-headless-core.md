# 11: Project skeleton and headless core

**What to build:** A runnable project (TypeScript, Vite, Vitest) with a pure headless core. A new game starts with 600 Urbs, the central 2x2 Parcels owned, one free Workshop and one free Factory pre-placed, and an auto-generated Seed. The core exposes `dispatch(command, now)` and `advance(now)` with an injected clock. Spec: `.scratch/urbix-mvp/spec.md`; see ADR 0002.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `npm run dev`, `build` and `test` work
- [x] A lint rule forbids importing `three`, React and DOM APIs, and `Math.random()` / `Date.now()`, inside the core folder
- [x] New game state matches the starting conditions above and is JSON-serializable
- [x] Seeded PRNG with its internal state stored in the state; same Seed and commands give the same state
- [x] Invalid commands return a typed error with a message key, never throw
- [x] Property tests: JSON round trip leaves state unchanged; `advance(t1); advance(t2)` equals `advance(t2)`
- [x] Backward `now` is clamped to `lastSeen`
- [x] Core cost, duration and tier values live in data tables, not in rule code
