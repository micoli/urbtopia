# Pure simulation core with injected clock and replay-based catch-up

The simulation core is pure TypeScript and never reads the clock: every command and every `advance(now)` call receives `now` from its caller. Production is stored as absolute timestamps (`startedAt` + `duration`). Catch-up after reopening the app, waking the device or returning to a hidden tab is not a separate mechanism: it is one `advance(now)` call over the whole gap, replayed event by event in chronological order, capped at 48 game hours.

Randomness comes from a PRNG seeded by an auto-generated text seed per game. The PRNG's internal state is part of the serialized state.

## Why

- No server means no authoritative clock; the core stays deterministic and testable headless with a simulated clock.
- A single `advance` path for live play (1 Hz) and catch-up removes special cases: a slot that finishes frees its queue, a full Storehouse blocks collection, and the Market buys in order, all identically offline and online.
- Storing the PRNG state (not only the seed) makes the result independent of tick size and save/reload points, which allows the property test `advance(t1); advance(t2) == advance(t2)`.
- Closed-form per-building catch-up was rejected: it ignores interactions between buildings.

## Consequences

- Backward clock changes are clamped to the last seen time; forward changes are accepted (solo game, no premium currency, nothing to protect).
- Time beyond 48 h offline is forfeited; the cap is a core config constant, and an `OfflineTimeCapped` event informs the UI.
- Replay cost is bounded by queue capacity times the cap; revisit if balancing introduces very short production times.
- Rules must not use `Math.random()` or `Date.now()` inside the core; a lint rule forbids importing `three`, React and DOM APIs there.
- Save and export include the seed, PRNG state and `lastSeen`.
