---
status: accepted
---

# A Replan lifts the whole layout into a saved Stash, in the same City

Respects ADR 0003 (save envelope), ADR 0015 (Cloud save), ADR 0047 (Cities) and ADR 0043 (Bridges over infrastructure). Amends the "refused" rules on removing the last access of a Building or a Water tile, which are suspended while a Replan lasts.

A player unhappy with their City can **Replan** it: everything they placed (Buildings, Roads of every Carrier and Level, Water tiles, Fields, Orchard trees, Hives) is lifted into the **Stash** and laid out again on the same Parcels. The mode starts from City management, Cities, on the row of the open City. Five choices are hard to reverse and look odd without context.

**In the same City, not in a new one.** The Replan keeps the City's Urbs, Citizens, Seed, Objectives, politics and Showcase. Creating a second City and moving Buildings into it was rejected: nothing transfers objects between Cities, the old City would still have to be dealt with (Hall of fame, Showcase, Cloud saves, the three-City cap of ADR 0047), and the player would lose their progress to change a layout.

**An object is lifted whole, never rebuilt.** A lifted object keeps its id, Tier, contents (Venue and Home interiors, Factory floor, stock, Slots), its Boat and its Club. A "recipe" that destroys the object and builds a new one was rejected: ids live in saves.

**Transit lines are not restored.** A line is tied to where its stops stand, and the new layout is made for different Roads, so the old lines would rarely fit. Stops and stations are lifted as plain objects, the lines are dropped, and the player draws them again; purchased vehicles stay with the City. Cancel restores the lines with the starting layout. Keeping a line alive across a Replan was rejected as costly and misleading.

**The Stash is part of the save.** A Replan survives closing the tab and is carried by the Cloud save, so two devices of one Player account meet it as they meet any City. At entry the game keeps the layout it started from, and Cancel restores it exactly. The Replan ends only when the Stash is empty; it checks no connectivity, and lists the Buildings left with no access (power is a pool for the whole City, not a link to a place) and the Transit lines to draw again. Auto-cancel on close was rejected: it would erase minutes of work.

**The game stands still and the Replan is free.** The economy, Citizens, production and the Day cycle pause at entry and resume at exit with no Catch-up for the time spent, so a City without Roads is never judged. It costs no Urbs, and Build limits and Escalating prices do not move, since nothing is built or destroyed. A Replan is refused during a Challenge (as a Time skip is), during the Tutorial and while a Save conflict is open.

**The Showcase is replaced at the end only.** Visitors keep the last complete City; the half-laid one stays private in the Cloud save.

**Dropping is the one way to earn.** A long press on a group of the Stash offers to drop it for its initial price, with its Tiers, solar panels, insulation and Slots; it differs from a sale, which pays a share of the base price. The Urbs taken are noted in the Replan, and Cancel takes them back with the items. A group can also be put off to a Later section at the bottom of the list. A Storehouse, Water tower, Marina or Pirate cove that the rest of the City still needs cannot be dropped.

## Consequences

- The save envelope gains an optional Stash and an optional starting layout; a save without them is a City with no Replan in progress, so no migration (ADR 0003).
- Placement rules that tie an object to another (a Bridge to its Water or network, a Boat to its Marina, a Crossing to its Road, the last access of a Building) are suspended while lifting and not checked again at exit. Only the placement rules of each object (free tile, owned Parcel, rotation) apply while placing.
- The Parcels do not change during a Replan: whatever left the map fits back in the same space.
- The Stash offers no "put back in place" and the map shows no ghost of the starting layout: the player replans from what they see; only Cancel returns to the start.
- The Replan ships behind the `replan` feature flag. Only `StartReplan` is gated: a Replan already under way can always be placed, finished or cancelled, so switching the flag off never strands a City.
- Automatic layout suggestions are out of this version. The Advisor (ADR 0056) stays a text writer.
