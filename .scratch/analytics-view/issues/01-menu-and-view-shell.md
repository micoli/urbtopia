# Menu And View Shell

Status: resolved
Spec: ../spec.md

## What to build

Turn the Land dock entry into a flyout (Parcels, Analytics) with the Movement layers and Data layers submenus, and the Analytics view mode itself: UI store state (active Layer or none), Escape and menu exit, build tools disabled, floating badges, Vehicles and animated Pedestrians hidden, last Layer remembered in local storage. Layers are listed but draw nothing yet.

## Acceptance criteria

- [ ] Land opens a flyout; Parcels keeps the current behaviour.
- [ ] Analytics lists Movement layers (Pedestrians, Cars, All) and Data layers (Service coverage by category, Well-being, Pollution, Congestion, Odor radius, Land value).
- [ ] Picking a Layer enters the view; Escape or another entry leaves it and restores badges, Vehicles and Pedestrians.
- [ ] Tools cannot be armed during the view; the city is never modified.
- [ ] Last Layer survives a reload (wrapped in try/catch like `readBuildSection`).
- [ ] FR/EN strings; component stories and tests in the style of the Networks flyout.
- [ ] Terms added to CONTEXT.md (done in the grilling).
