# Simulation model and time

Type: grilling
Status: resolved
Blocked by:

## Question

Define how game time works: timestamp-based completion of production, catch-up on reopen, handling of clock changes, state shape of the headless simulation core, commands/events boundary with the UI. Decide determinism needs and how the core is tested.

## Answer

- **Production**: slots with a manual queue and manual collection. Each slot holds `startedAt` + `duration`; it completes at `startedAt + duration`. Finished output waits on the building until collected, and collection is blocked when the Storehouse is full.
- **Time**: the core never reads the clock. Every command and every `advance` receives an injected `now`; production uses `Date.now()`.
- **Clock changes**: backward jump is clamped (`now < lastSeen` is treated as `lastSeen`); forward jump is accepted.
- **Catch-up**: replayed event by event in chronological order, through the same `advance(now)` used while playing. While the app is open a 1 Hz loop calls `advance(now)`; on reopen or on `visibilitychange` to visible, one call processes the whole gap.
- **Catch-up cap**: 48 game hours, a core config constant. Time beyond the cap is forfeited (`now` becomes `lastSeen + 48h`, then `lastSeen` is reset to real time) and an `OfflineTimeCapped` event is emitted.
- **Core boundary**: `dispatch(command, now) -> { state, events }`. Commands: `PlaceBuilding`, `QueueProduction`, `Collect`, `Upgrade`, `Sell`, `Demolish`. Events (`ProductionCompleted`, `StorageFull`, `HomeUpgraded`, ...) feed UI only (toasts, sounds), never mutate state. Invalid commands return a typed error, no exception. State is JSON-serializable; Zustand holds the current state and calls `dispatch`.
- **Determinism**: randomness is allowed through a seeded PRNG. Each game has an auto-generated text seed (e.g. `amber-fox-4821`), stored in the state and included in exports, visible to the player but not editable in the MVP. The PRNG internal state (mulberry32 or sfc32 seeded by a hash of the seed) is stored in the serialized state, so catch-up gives the same result regardless of save/reload points or tick size.
- **Tests**: Vitest. Command tests with an injected clock; property tests that `advance(t1)` then `advance(t2)` equals `advance(t2)`, and that state survives a JSON round trip unchanged. Lint rule forbids `three`, React and DOM imports in the core folder.
- **Background tab**: on `visibilitychange` visible, call `advance(Date.now())` (same path as reopen, cap applies); save on `visibilitychange` hidden and `pagehide`. Autosave cadence goes to the save format ticket.
- ADR: [0002](../../../docs/adr/0002-pure-core-injected-clock-replay-catch-up.md).
