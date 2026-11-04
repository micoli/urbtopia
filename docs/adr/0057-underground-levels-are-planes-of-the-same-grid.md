---
status: accepted
---

# Underground Levels are planes of the same grid

Extends ADR 0006 (independent networks), ADR 0038 (cycling over the pedestrian network) and ADR 0043 (Bridges over infrastructure). Respects ADR 0001 (chunked instancing), ADR 0003 (save envelope) and ADR 0034 (zero-cost lighting on mobile).

The map gains two **Levels** under the Surface: Level -1 for pedestrians, Level -2 for the Metro. Four choices are hard to reverse and look odd without context.

**Same grid, one plane per Level.** A tile keeps its coordinates and exists on every Level. Nothing on one Level occupies the tile on another, so a Tunnel or an Underground walkway lies under Buildings, Roads, Bridges and Water without any rule between Levels. Only the access objects (the Pedestrian access and the Metro station) need a free Surface tile. A separate underground map was rejected: it would double the coordinates, the chunking and the save, and lose the link between what the player sees above and below.

**The Metro is a fourth, independent mode.** It sits beside Bus, BRT and Railway, with its own Tunnels, Metro stations, lines and purchased vehicles, and is never slowed by Congestion. It takes part in Transfers (ADR 0007) and in Transit reach (ADR 0042). Burying the Railway was rejected: a Railway is never a Carrier and its surface rules (Access mode, Bridges) would have to be switched off for a case of its own.

**The Underground walkway extends the pedestrian graph.** Walking and Cycling trips use it like a Pedestrian way, it loads no Crossing, and it has no capacity limit. No Building opens onto it. Street view stays on the Surface in this first version.

**One Level is edited at a time.** A Level selector in the dock shows the active Level in full colour, with the Surface drawn as a flat translucent silhouette without shadows, or hidden when the render budget of a phone is exceeded. Showing all Levels at once and a schematic editor were rejected: the first is unreadable in isometric view, the second breaks the link with the map.

The save gains optional entries for Underground walkways, Tunnels and Pedestrian accesses; a save without them is a city without underground, so no migration (ADR 0003). The Level never feeds back from the scene into the core (ADR 0011).
