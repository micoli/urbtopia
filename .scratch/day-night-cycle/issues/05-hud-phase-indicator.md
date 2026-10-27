# HUD phase indicator

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

The HUD already shows a clock (`src/ui/stats/GameClock.tsx`, game clock hh:mm). Make it show the Day cycle instead: sun or moon icon and the cycle time (for example 14:00). Its quadruple click skips 12 real hours, which is 6 whole cycles: the displayed time does not change.

## Acceptance criteria

- [ ] Updates once per second, follows Time skip.
- [ ] FR/EN strings; story and test in the style of neighbouring HUD components.
