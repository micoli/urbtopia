# City Management: slowed lines

Status: resolved
Blocked by: 01, 02

## What to build

Show each Bus line's effective speed and capacity, and the number of slowed lines.

## Acceptance criteria

- [x] Transport section: per Bus line effective speed in %, effective capacity, 'slowed by traffic' below 90%
- [x] Traffic section: number of slowed lines
- [x] FR/EN strings, one React component per file
- [x] Component tests: presence, threshold, FR/EN, no NaN or undefined
- [ ] Checked by eye in the dev server (not done: tests only)

## Comments

## Answer

`LineSpeed` and `lineSpeed.ts` (effective speed in %, "slowed by traffic" below `BUS_TRAFFIC.slowedBelow`); `LineMetrics` shows it in the line editor (capacity already shows the effective one), `LineListItem` flags a slowed line with its speed, `SlowedLines` in the Traffic section shows the number of slowed lines. FR/EN strings `transit.effectiveSpeed`, `transit.slowedByTraffic`, `eco.slowedLines`. Test in `CityManagement.test.tsx`. Visual check in the dev server still to do.
