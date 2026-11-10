# Replan

Status: implemented, release note and deploy pending

Decisions from the grilling session. Vocabulary in `CONTEXT.md` (Replan, Stash). Rationale in ADR-0067.

## Problem

A player unhappy with their City cannot redo its layout: the `move` tool lifts one Building at a time and demolishing loses the Building. She wants to keep her Buildings and re-place Roads, Water and Buildings differently.

## Rules

- Entry: City management, Cities, button on the row of the open City (`src/ui/system/CityRow.tsx`), with a confirmation (the game stands still, Cancel restores).
- Refused, with the reason written next to the button: during a Challenge, the Tutorial, or an open Save conflict. Available on every Difficulty.
- Entering lifts everything the player placed into the Stash: Buildings, Roads of every Carrier and Level (Bridges, Pedestrian ways, Walkways, Tunnels, Underground walkways, Metro stations, Pedestrian accesses), Crossings, Water tiles, Boats, Fields with their Crops, Orchard trees, Hives. Parcels never change.
- A lifted object is the same object when placed again: id, Tier, contents (Venue and Home interiors, Factory floor, stock, Slots), Boat, Club.
- Transit lines are not restored: stops and stations are lifted as plain objects, the lines are dropped and the player draws them again. Purchased vehicles stay with the City. Cancel brings the lines back with the starting layout.
- While lifting, the "refused" rules that tie objects together are suspended (last access of a Building, Water under a Bridge, Marina with Boats...). While placing, only each object's own placement rules apply (free tile, owned Parcel, rotation).
- The game stands still: economy, Citizens, production and Day cycle pause at entry and resume at exit, with no Catch-up for the time spent. Free, earns nothing, Build limits and Escalating prices unchanged.
- The Stash and the starting layout are saved (Cloud save included) and the Replan resumes after a reload. Old saves have no Replan.
- Cancel restores the starting layout exactly. Finish only when the Stash is empty, then a summary lists Buildings with no access (Road, BRT corridor or Pedestrian way) and the lines to draw again (no blocking). Power is a pool for the whole City, so it is not part of the summary.
- The Showcase keeps the last complete layout until the Replan ends.
- Out of scope: automatic layout suggestions, a ghost of the starting layout, a "put back in place" action. The Advisor stays a text writer.

## Delivery order

1. Stash model and lift/place of Buildings (core).
2. Infrastructure, Water and farming objects.
3. Identity: Boats, Clubs; Transit lines dropped, vehicles kept.
4. Save, Cloud save, resume, Showcase deferral.
5. Clock pause, no Catch-up.
6. Start, Cancel, Finish commands and refusals.
7. Entry button and Stash tray.
8. Finish summary.
9. Tutorial, guide, codex, i18n, e2e.
