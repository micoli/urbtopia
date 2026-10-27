# Lit windows at Night

Windows of powered buildings light up at random during the Night. Vocabulary: see `CONTEXT.md` (Lit window, Night, Day cycle, Always day). Decision: ADR 0050. Builds on `.scratch/day-night-cycle` and ADR 0049 and 0034.

## Rules

- Every glass window of every building on the map is eligible, each on its own. Vehicles, `VenueScene` and buildings without glass are untouched.
- A window is lit only if its building is powered (supplied by `energyStats`). A building in shortage stays dark.
- About 60% of the windows are ever lit in a Night. A used window switches on at a time drawn between 22:00 and 00:30 and off between 00:30 and 05:30 (Cycle hours). No window is lit in Daytime.
- The draw is deterministic and scene-only: window place plus the number of the Day cycle. No `Math.random()`, nothing saved, nothing in the core.
- Look: warm yellow, constant intensity, no flicker, no bloom, no light source. Visible in street view.
- Always day switches every window off. `?time=` drives the windows too.

## Technique

- The building models have no emissive. Their windows use the palette cell of the `glass` role (`glass_blue` in the urbtopia style). A patch of the material shader (`onBeforeCompile`) lights the pixels of that colour, with a per-window draw from the world position, and no model is regenerated.
- Buildings are drawn as `InstancedMesh` with a shared material per model and tint, so "powered" is a per-instance attribute refreshed about once a second, with the Night clock as a uniform.

## Budget

ADR 0050 extends ADR 0034: frame time measured before and after on the same dense city (at most +5% median), and the feature is switched off on devices detected as `low-power`.

## Out of scope

Street lamps, light on streets or the ground, traffic headlights, bloom, flicker, windows seen from inside, Citizens present in the rooms.
