# Apply the bonus to the Slots

Status: resolved
Blocked by: 02

## Answer

- Speed: `productionDurationOf` divides the duration by `1 + speed bonus` of the floor.
- Yield: a fraction of the yield cannot be paid in whole units, so each cycle owes `yield × bonus` plus a `carry` kept on the floor; the whole units are paid at once, the rest carried (`newQueueEntry` now returns the entry and the Factory). A fair share comes out over many cycles, with integers only, no randomness.
- The Storehouse reserves room for the largest cycle (`maxQuantityOf`).
- The bonus is read when a production is queued and stays with that entry (the duration and the quantity are fixed in it, as the Tier's are).
- No floor, an empty floor or no linked Machine produce exactly as before (tests).
