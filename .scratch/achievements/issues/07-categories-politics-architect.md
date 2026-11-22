# Categories 6 and 7

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

Politics and Architect.

## Acceptance criteria

- [ ] Politics hidden under Cozy and giving no Medal there; Achievements unlock from Easy.
- [ ] Election and Objective Achievements are raised by the simulation and counted in a Catch-up summary.
- [ ] Architect Achievements unlock from the plan Commands and the plan-to-Home result.
- [ ] One test per category completing it.

## Notes

Politics Achievements carry `fromDifficulty: 'easy'`. An impossible Achievement is now never latched nor seeded (`availability.ts`). "Objective met" counts the Objectives completed in the cycle, "Facing the voters" the Elections gone through (Term number minus one, Medium and up). Architect gained an Architect office Achievement, so it has five.
