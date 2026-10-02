# 23: Catch-up on reopen

**What to build:** On reopen, device wake or return to the tab, the city has progressed as if the game had been running, up to 48 game hours. See ADR 0002.

**Blocked by:** 17, 22

**Status:** ready-for-agent

- [x] Live play calls `advance(now)` at 1 Hz; reopen and `visibilitychange` to visible call it once over the whole gap
- [x] The gap is replayed event by event in chronological order: Slot completion, Storehouse limits, Shop sales and Market recovery behave as in live play
- [x] Time beyond 48 h is forfeited (config constant), `lastSeen` reset, and an `OfflineTimeCapped` event shows a toast
- [x] Backward clock change is clamped to `lastSeen`
- [x] Toasts report events (production completed, storage full, Home upgraded)
- [x] Tests: chunked advances equal a single advance; cap behaviour; Catch-up result independent of save and reload points
