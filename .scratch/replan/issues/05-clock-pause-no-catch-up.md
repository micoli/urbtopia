# Stand still during a Replan, with no Catch-up

Status: resolved
Blocked by: 01, 04

- Economy, Citizens, production, politics and Day cycle do not advance while a Replan is active.
- At Finish or Cancel the time spent is skipped: no Catch-up and no summary for it. A City closed during a Replan reopens still in it.
- Done when: tests that the game clock and the economy do not move during a Replan, including across a reload and a long absence; `tsc`, lint and tests pass.

## Answer

Done. `advance` returns early while `state.replan` exists (`standStill`, `src/core/engine/advance.ts`): `lastSeen` follows the clock, `timeOffset` goes back by the gap so the game clock (politics, Day cycle) stays put, and `shiftRunningTimers` moves every running timer. No events, no Catch-up, however long the absence. A negative `timeOffset` is now valid in a save.
