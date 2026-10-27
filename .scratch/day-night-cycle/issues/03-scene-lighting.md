# Scene lighting

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Light the map from the Day cycle: sun, hemisphere, environment, background and exposure interpolated smoothly, refreshed once per second. No fog added; the street-view fog colour follows the background.

## Acceptance criteria

- [ ] Day, dawn, dusk and Night looks; Night is bluish with a floor near 40 % of day light.
- [ ] Analytics layers, ghosts and `VenueScene` unchanged.
- [ ] Before/after frame-time measurement within the ADR 0034 bar (+5 % median).
