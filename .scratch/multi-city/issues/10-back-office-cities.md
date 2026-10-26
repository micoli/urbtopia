# Back office: Cities

Status: in progress - the name reset waits for 05
Blocked by: 02 (done), 05 (for the name reset)
Spec: ../spec.md

## What to build

The Back office shows Cities, not a single save, per Player account.

## Acceptance criteria

- [x] The account view lists its Cities with City name, Citizens and Cloud save history. (The name shown is the Seed-based default, since no City name is stored online yet.)
- [ ] An Admin can reset a City name to its Seed-based default.
- [x] Inspecting a Cloud save picks the City.

The City name only lives on the device until 05 stores it online next to the Showcase. The reset then becomes a single update of that online name to its Seed-based default.
