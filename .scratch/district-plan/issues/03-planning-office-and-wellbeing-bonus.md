# Planning office and Well-being bonus

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## What to build

The Planning office building with Tiers, its Build limit and Escalating price, and the Well-being bonus its Rank gives to the Homes within its radius.

## Acceptance criteria

- [ ] A building definition under `assets/defs/buildings` with Tiers, unlocked at 150 Citizens, with a Build limit and an Escalating price; a placeholder model until the real one exists.
- [ ] A Home takes the best bonus among the offices that reach it, never the sum.
- [ ] The bonus is 40 %, 70 % or 100 % of the cap of the Tier by Rank, never negative, and 0 for an office that was never played.
- [ ] The Well-being code reads the bonus through the Planning office; nothing else of the simulation changes.
- [ ] Demolishing an office removes its bonus at once.
- [ ] Raising the Tier applies the new cap to the best score at once.
- [ ] Tests: overlap of two offices, demolition, Tier raised, unplayed office.
