---
status: accepted
---

# Day cycle separate from the economy clock

The map alternates Daytime and Night on a Day cycle of 2 real hours: 16 Cycle hours of Daytime (06:00 to 22:00) and 8 of Night, with one-Cycle-hour fades of dawn and dusk inside the Night. The Day cycle is a second clock, derived from the game clock (real time plus `timeOffset`, anchored on the UTC epoch). It drives the light of the map and the output of solar and water power, and nothing else. The economy keeps its own hours: production in absolute real milliseconds, taxes and costs per real hour, the game day of 24 real hours of Terms and Approval, and the 48 hour Catch-up cap of ADR-0002.

## Why

- Accelerating the whole clock to a 2 hour game day was rejected. Every per-hour rate, the length of a Term, the Catch-up cap and the meaning of a Time skip would have to be rebalanced, which is a redesign of the game and not a lighting feature.
- Anchored on the game clock, the phase needs no saved state, is the same on every device and in every City, and is replayed identically by Catch-up (ADR-0002). The device's local time is not used, since a 2 hour cycle has no relation to it and it would make the core depend on the time zone.
- A new City gets an initial `timeOffset` so it starts at dawn and the first minutes of the Tutorial are in daylight.

## Consequences

- Two kinds of hour coexist: a game hour (1 real hour) and a Cycle hour (5 real minutes). The glossary names both and `CONTEXT.md` forbids "hour" and "day" alone for the Day cycle.
- The energy simulation advances in steps of one Cycle hour instead of one real hour, so a 48 hour Catch-up replays about 576 steps instead of 48. Revisit if replay cost shows up in a profile.
- Solar is produced over 16 hours instead of 12, about 33 % more daily energy at the same peak. Capacities and prices are not rebalanced. Wind keeps its 6 real hour pattern.
- A Time skip still counts real hours and moves the Day cycle by 12 Cycle hours per real hour skipped.
- The lighting changes only global parameters (sun, ambient, background, exposure), so it stays within the budget of ADR-0034. Windows and street lamps need model changes and are left out.
- `?e2e` turns on the Always day setting so visual baselines stay stable.
