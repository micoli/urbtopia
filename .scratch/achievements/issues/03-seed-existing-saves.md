# Seeding of existing saves

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

On first open of a save without an `achievements` field, fill the Achievements the City state proves (the "Retro" column of the spec).

## Acceptance criteria

- [ ] A proof function per retro Achievement, tested on fixture saves.
- [ ] Seeding runs once, silent, then one summary toast.
- [ ] A non-retro Achievement stays to do.
- [ ] Seeding is not run in a Visit.
