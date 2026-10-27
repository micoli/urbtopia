# Scene lighting

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Light the map from the Day cycle: sun, hemisphere, environment, background and exposure interpolated smoothly, refreshed once per second. No fog added; the street-view fog colour follows the background.

## Acceptance criteria

- [x] Day, dawn, dusk and Night looks; Night is bluish with a floor near 40 % of day light.
- [x] Analytics layers, ghosts and `VenueScene` unchanged.
- [ ] Before/after frame-time measurement within the ADR 0034 bar (+5 % median). Not measured with a trace yet: the change only sets light uniforms once per second.
