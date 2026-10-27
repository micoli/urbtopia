# Day and night

The map alternates Daytime and Night. Vocabulary: see `CONTEXT.md` (Day cycle, Daytime, Night, Cycle hour, Always day). Decision: ADR 0049.

## Rules

- Day cycle: 2 real hours, anchored on the game clock (`now + timeOffset`, UTC epoch). No saved state.
- Daytime 06:00 to 22:00 (16 Cycle hours), Night 22:00 to 06:00 (8). Dawn and dusk are one-Cycle-hour fades inside the Night (05:00-06:00, 21:00-22:00).
- A new City and the Tutorial start at dawn (initial `timeOffset`).
- The economy is untouched: game hours, game days and the 48 h Catch-up cap stay as they are. A Time skip counts real hours and moves the cycle.

## Energy

- Solar follows Daytime (zero at Night, sinusoid 06:00-22:00, peak 1, no rebalancing).
- Hydro follows the Day cycle (sinusoid over 24 Cycle hours, 0.8 to 1.0). Wind keeps its 6 real hour pattern.
- `advance()` steps by one Cycle hour instead of one real hour.

## Scene

- Only sun colour and intensity, hemisphere and environment, background and exposure vary. Smooth interpolation, refreshed at 1 Hz. Night is bluish with a floor of about 40 % of the day light.
- No fog added. The existing street-view fog colour follows the background.
- Analytics layers, ghosts and `VenueScene` are unchanged. No lit windows or street lamps (separate ticket later).

## Player and tests

- Setting "Always day": per device, outside the save, off by default.
- URL: `?e2e` implies Always day; `?always-day` alone; `?time=HH:MM` pins the cycle hour for night tests.
- HUD indicator: phase icon and cycle time.

## Out of scope

Shop opening hours, commutes, Citizens behaviour, traffic, transit peaks, street lamps, lit windows, Annual events.
