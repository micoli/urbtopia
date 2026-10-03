# 22: Local persistence

**What to build:** The city is saved automatically and restored on reopen. See ADR 0003.

**Blocked by:** 17

**Status:** resolved

- [x] `SaveStore` interface (get/put/remove) with a localStorage implementation
- [x] Envelope `{ format: "urbtopia-save", version, savedAt, state }`; state holds lists only; derived data is rebuilt on load
- [x] Runtime validation at the load boundary; ordered pure migrations tested with frozen fixtures per version
- [x] A save newer than the app is refused and never overwritten
- [x] Autosave: 2 s debounce after a state-changing command, 30 s tick while dirty, on `visibilitychange` hidden and `pagehide`; never per 1 Hz tick
- [x] `navigator.storage.persist()` called on first save
- [x] New game asks for confirmation
- [x] Tests with a fake `SaveStore`: round trip, migration chain, malformed state rejected
