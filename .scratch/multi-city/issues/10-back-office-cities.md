# Back office: Cities

Status: done - implemented
Blocked by: 02, 05
Spec: ../spec.md

## What to build

The Back office shows Cities, not a single save, per Player account.

## Acceptance criteria

- [x] The account view lists its Cities with City name (the online one when the City has a Showcase), Citizens and Cloud save history.
- [x] An Admin can reset a City name to its Seed-based default.
- [x] Inspecting a Cloud save picks the City.

The reset updates the online name to its Seed-based default and remembers the replaced name, so the player's next publication does not bring it back.
