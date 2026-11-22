# Seeding of existing saves

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

On first open of a save without an `achievements` field, fill the Achievements the City state proves (the "Retro" column of the spec).

## Acceptance criteria

- [ ] A proof function per retro Achievement, tested on fixture saves.
- [ ] Seeding runs once, silent, then one summary toast.
- [ ] A non-retro Achievement stays to do.
- [ ] Seeding is not run in a Visit.

## Notes

Seeding is the save migration 21 to 22 (`seedAchievements`), so every load path (open City, import, Cloud restore) gets it and the old save is backed up first. The summary toast shows at boot, which is also where a City switch ends (it reloads). A "Visit" of an old Showcase seeds in memory only and shows nothing.
