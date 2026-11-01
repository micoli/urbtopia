# 04 Knowledge speeds production and Offices

Status: resolved
Blocked by: 03

Red first: with city Knowledge 100 an Industry building's `productionDurationOf` shrinks so the output rate is +25%; Packhouse (not an Industry building) is untouched; Knowledge 0 or null changes nothing. `officeUrbsDue` takes +25% through the existing `yieldMultiplier` path (compose with the Ordinance multiplier, do not replace it). Decide and test how a run already started behaves (suggest: duration fixed at start, no retroactive change). Catch-up/offline replay must give the same result as live play.

## Answer

Done, see the commit of this ticket in the history (`git log --grep` on its title).
