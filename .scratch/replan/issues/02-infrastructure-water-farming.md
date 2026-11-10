# Lift and place infrastructure, Water and farming objects

Status: resolved
Blocked by: 01

- Lift and place Roads of every Carrier and Level, Bridges (ADR 0043), Pedestrian ways, Walkways, Tunnels, Underground walkways, Metro stations, Pedestrian accesses, Crossings, Water tiles, Fields with Crops (growth kept), Orchard trees, Hives.
- Suspend the refusal rules of ADR 0043, the Water rules (Bridge, Marina, Pirate cove, Desert island, Sea fort) and the last-access rule while lifting.
- A Bridge, a Crossing or a Boat is placed under its own rules once its Road, Water or Marina is placed.
- Done when: tests lift a whole city to an empty map and place it back identical; tests that a Bridge over Water cannot be placed before its Water tiles; `tsc`, lint and tests pass.

## Answer

Done, in `src/core/replan/`. `stashTiles.ts` lifts and places Roads (with Crossings), Pedestrian ways, Walkways, Pedestrian accesses, Water tiles, Fields with Crops and Roundabouts; the Stash pays back the first tile that fits, one target at a time. `stashNetworks.ts` handles the BRT corridor, Railway and Tunnels by path (the Stash counts tiles, the exits are worked out again by `extendNetwork`). `stashWater.ts` lifts Bridges (deck removed) and Boats, and places them under the rules of a new one, free. Orchard trees and Hives are Buildings, so they go through ticket 01. Bridge before Water is refused with `error.bridgeNeedsWater`.
