# Attraction definitions and Tourist demand

Status: resolved
Spec: ../spec.md

## What to build

Add an `attraction` field (drawing power, per Tier) to the building definitions of every Attraction listed in the spec, and a pure function giving the daily Tourist demand of the city: sum of drawing powers times `cityAttractiveness`, with a Hotel lodging multiplier on stay and spending.

## Acceptance criteria

- [x] Schema and JSON of all Attractions updated; Hotel declares no `attraction`.
- [x] Demand function in `src/core`, no DOM or three import, deterministic.
- [x] Tests: no Attraction gives no Tourists; Tier raises demand; Hotel raises spending, not demand.
