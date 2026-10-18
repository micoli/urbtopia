# Venue tutorial core, banner and Arcade steps

Type: task
Status: ready-for-agent

## What to build

The generic Venue tutorial mechanism in `src/core`, its banner in the UI, and the Arcade steps. See `../spec.md`.

## Seams under test

- `isVenueStepDone(state, type, step)` and `progressVenueTutorial(state)`: `GameState` in, step out, for the Arcade.
- Start: placing the first Arcade creates the entry, a second Arcade changes nothing, the initial Tutorial active or the bypass flag creates none.
- `collectTakings` increments `VenueData.collected`.
- Save migration: a Venue already placed gets `null`, a save without Venue gets no entry. `validate.ts` accepts the new field.
- Commands: skip and replay a Venue tutorial.

## Acceptance criteria

- [ ] `GameState.venueTutorials` and `VenueData.collected` exist, saved, validated and migrated; fixtures updated.
- [ ] The four Arcade steps validate from `GameState` only and advance automatically, steps already done chain instantly.
- [ ] No command is locked.
- [ ] Skip ends the tutorial; replay re-enters at the first step not done and is hidden when all are done.
- [ ] `TutorialBanner` is parameterised and shows the Venue tutorial, the initial Tutorial banner takes priority.
- [ ] `?bypass-tutorial` disables it, and e2e scripts still pass.
- [ ] Texts in `en` and `fr`, Storybook story, `CONTEXT.md` has `Venue tutorial`.
- [ ] Typecheck, lint and the full test suite pass.
