# City Management: car / public transport / walking mix

Status: ready-for-agent
Blocked by: 02, 03, 04

## What to build

Show the three-way mix and the walking information in City Management.

## Acceptance criteria

- [ ] Traffic section: mix car / public transport / walking in %, replacing the two-way mix
- [ ] Traffic section: walking Commuters, walking trips by service type, saturated Crossings count, with help text
- [ ] Overview tile shows the walking share; the Congestion tile keeps its alert
- [ ] Saturated Crossing tinted on the map like congested sections
- [ ] Consistency with Riders and Modal shift figures (a Rider is never a walker)
- [ ] FR/EN strings, one React component per file
- [ ] Component tests in `CityManagement.test.tsx` style: presence, FR/EN, no `NaN` or `undefined`
- [ ] Checked by eye in the dev server

## Comments
