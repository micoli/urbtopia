# Underground network

Status: ready-for-agent

Vocabulary and decisions: `CONTEXT.md` (Level, Underground walkway, Pedestrian access, Metro, Tunnel, Metro station), ADR 0057. Values: `balancing.md` (to write, ADR 0023).

## Confirmed scope

- Two Levels under the Surface, on the same grid: Level -1 (pedestrians) and Level -2 (Metro). Nothing deeper.
- A Level ignores the Surface: Tunnels and Underground walkways lie under Buildings, Roads, Bridges and Water. Only a Pedestrian access and a Metro station need a free Surface tile, touching a Sidewalk or a Pedestrian way.
- Level -1: Underground walkways join the Pedestrian path network (Walking and Cycling trips), load no Crossing, have no capacity limit, give no Building access. A Pedestrian access without a walkway below is inactive. A walkway left without access is marked disconnected.
- Level -2: Metro is a fourth public transport mode, independent of Road, BRT and Railway (ADR 0006). Tunnels, Metro stations, Metro lines, vehicles bought into the Transit fleet, never slowed by Congestion, in Transfers and Transit reach. A Metro station is placed from the Surface; it is inactive while no Tunnel lies under it. It is also an access to Level -1 when a walkway touches it.
- UX: a Level selector in the dock (Surface, -1, -2) and keys `[` and `]`. One active Level at a time, the Surface as a flat translucent silhouette without shadows (hidden when the phone render budget is exceeded). Walkers and Metro vehicles only drawn on their own Level. A tooltip on first use.
- Demolition: a Surface Building is never blocked by what lies below. Removing a Pedestrian access leaves the walkway, marked disconnected. Removing a Metro station removes it from its lines. A Tunnel without station stays, with no effect. Water edits above are allowed.
- Prices tunable in `balancing.md`: initial Walkway = 2x Pedestrian way, Tunnel = 3x BRT corridor, Level -2 dearer than -1. Walkways unlock after the Footbridge, Metro after the Railway. Thresholds to set with the owner.
- Save: optional entries, no migration (ADR 0003). Guide and Codex generated from definitions (ADR 0040); no Tutorial step.
- Street view stays on the Surface in this version.

## Slices

1. Level model, selector, ghost rendering, Underground walkway, Pedestrian access.
2. Metro: Tunnel, Metro station, lines, vehicles, Transfers, Transit reach.
3. Analysis views: Transport map, Transit layers, Walk flow.
