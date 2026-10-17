# Screenshot baselines for reference scenes

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Playwright baselines of four scenes: a dense city, the map edge, one Venue, the open build menu. Each loads with `/?bypass-tutorial`; the cities are built by `scripts/visualScenes.ts` instead of a save file.
- [x] Deterministic: fixed clock, fixed seed, no animation noise; stable on CI.
- [x] A documented command to update the baselines on purpose.
- [ ] Runs in CI without noticeably slowing it; the Storybook stories stay the reference for components.

## Progress

See `docs/visual-baselines.md`. Only the macOS baselines are committed; the Linux ones come from the manual "Visual baselines" workflow (`update` input), so CI stays unchanged. Remaining: generate and commit the Linux baselines.
