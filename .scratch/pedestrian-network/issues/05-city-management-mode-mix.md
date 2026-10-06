# City Management: car / public transport / walking mix

Status: resolved
Blocked by: 02, 03, 04

## What to build

Show the three-way mix and the walking information in City Management.

## Acceptance criteria

- [x] Traffic section: mix car / public transport / walking in %, replacing the two-way mix
- [x] Traffic section: walking Commuters, walking trips by service type, saturated Crossings count, with help text
- [x] Overview tile shows the walking share; the Congestion tile keeps its alert
- [x] Saturated Crossing tinted on the map like congested sections
- [x] Consistency with Riders and Modal shift figures (a Rider is never a walker)
- [x] FR/EN strings, one React component per file
- [x] Component tests in `CityManagement.test.tsx` style: presence, FR/EN, no `NaN` or `undefined`
- [x] Checked by eye in the dev server (Traffic section in French; Crossing tint not observed)

## Comments

## Answer

`ModeMix` (car / public transport / walking in %, from `modeShares`) and `WalkingSummary` (walkers, saturated Crossings, trips per destination type, help text) in the Traffic section; overview tile with the walking share linking to it; `CongestionLayer` tints saturated Crossings blue. FR/EN strings `eco.walk*`. Test in `CityManagement.test.tsx`.
