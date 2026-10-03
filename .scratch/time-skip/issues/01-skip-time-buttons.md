# Skip time from the menu

Type: task
Status: resolved
Blocked by:

## What to build

Two buttons in the menu, +12 h and +24 h, that move the game forward by 12 or 24 hours.

## Approach

`Date.now()` is the clock everywhere, so moving `lastSeen` into the future would freeze the game until real time caught up. Instead, a `SkipTime { hours }` command moves the whole timeline back (running production, shop sales, market prices, `lastSeen`) and replays it with `advance(now)`. The existing catch-up path does the work, with no second mechanism (ADR 0002).

## Seam under test

`dispatch(state, { type: 'SkipTime', hours }, now)`: production completes and can be collected, `lastSeen` stays on `now` so the game keeps running in real time, a Home accumulates its Tax up to the 8 hour cap. The two menu buttons are not tested automatically. Shop sales are not covered by a dedicated test.

## Acceptance criteria

- [x] `SkipTime` is a core command handled through `dispatch`.
- [x] The +12 h and +24 h buttons are in the menu, with FR/EN labels.
- [x] Typecheck, lint and the full test suite pass.
