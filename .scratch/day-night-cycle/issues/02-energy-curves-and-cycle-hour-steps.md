# Energy curves and Cycle hour steps

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Solar follows Daytime, hydro follows the Day cycle, wind unchanged. `advance()` steps by one Cycle hour.

## Acceptance criteria

- [ ] Solar is 0 at Night and a sinusoid between 06:00 and 22:00 with peak 1.
- [ ] Hydro sinusoid over 24 Cycle hours, between 0.8 and 1.0. Wind unchanged.
- [ ] `advance(t1); advance(t2)` equals `advance(t2)` still holds; Catch-up of 48 h replays correctly.
- [ ] Battery boundaries and the energy cache stay correct at Cycle hour steps.
- [ ] Existing energy tests updated, new tests for the Night.
