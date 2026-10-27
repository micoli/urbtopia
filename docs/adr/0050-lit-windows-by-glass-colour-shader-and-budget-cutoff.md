---
status: accepted
---

# Lit windows by a glass-colour shader, with a budget cutoff

Extends [ADR 0034](0034-zero-cost-lighting-on-mobile.md) and builds on [ADR 0049](0049-day-cycle-separate-from-the-economy-clock.md).

At Night, the windows of the buildings of the map light up on their own, at random, and only in a building that has power. Three choices are hard to reverse and look odd without context.

**A shader patch keyed on the glass colour, not new models.** The building models have no window material: every window uses one cell of the shared palette, the `glass` role (`#9fcdea`), and 273 of the 285 building models contain it. A patch of the building materials lights the pixels of exactly that colour. Regenerating the models with an emissive mask would have touched about 290 Blender recipes. The cost is that any other part painted with that colour would glow too, and that the glass cell must stay unique to windows in the palette.

**The draw runs on the GPU with an integer hash.** A window is the cell of its world position (0.5 wide, 0.3 high). A PCG hash of the cell and of the number of the Night decides whether it is used, when it lights and when it goes out. `windowSchedule.ts` holds the constants and the same hash in TypeScript for the tests. A `sin`-based hash was rejected because its result differs from one GPU to another, and every player must see the same city. The pattern is not saved and not in the core.

**Power splits the instanced meshes.** A model's geometry is shared by every chunk, so a per-instance "dark" attribute would have needed a copy of the geometry per chunk. The items of an unpowered building go into their own instanced mesh with an unpatched material instead, and only the chunks that hold a changed building are rebuilt. A building is unpowered when it needs power and gets less (`unpoweredBuildingIds`), never during an Adaptation period.

## Budget

ADR 0034 speaks of a `low-power` detection already in place; the code only requests a low-power GPU context, and nothing measures a slow device. A `FrameBudgetMonitor` now watches the time between two rendered frames while windows shine: when the median of the last 90 frames is above 45 ms (the loop aims at about 33 ms), the windows go out for the rest of the session.

On the desktop GPU of the development machine, with 348 buildings, 180 draw calls and about a million triangles, a frame takes about 6.2 ms with the windows and 6.6 ms without, which is within the noise. The +5 % bar of ADR 0034 is not shown on a reference phone: it still needs a performance trace on one.

## Consequences

- A new building style must keep the `glass` cell for its windows and nothing else.
- Render items carry the id of their building, so that a building that loses or regains power is redrawn in the right mesh.
- Windows are not saved, not simulated and not read by any rule. Street lamps and light on the ground are separate work.
