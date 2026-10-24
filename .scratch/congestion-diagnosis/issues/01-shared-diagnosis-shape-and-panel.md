# Shared Diagnosis shape and panel

Status: resolved
Spec: ../spec.md

## What to build

The types and the React panel that every Diagnosis (Congestion now, Waste next) uses. No rule yet.

## Acceptance criteria

- [ ] `src/core/diagnosis/diagnosis.ts` exports `Cause` (`key`, `weight` 0 to 1, `params` of numbers and strings, `focus` as a list of tiles, possibly empty) and `Diagnosis` (`causes` sorted by weight descending), plus a helper that sorts, drops causes under a minimum weight and keeps the first three.
- [ ] Unit tests for the helper: order, ties broken by key, cut-off, limit of three.
- [ ] A `DiagnosisPanel` component (one component per file) renders a Diagnosis: a title, one line per Cause through `t(key, params)`, and a "Show on map" button when `focus` is not empty, wired on `useUi` `showTile` with the first tile.
- [ ] Renders nothing when the Diagnosis is empty.
- [ ] Storybook story with one, three and zero Causes, in the style of the other management stories.
- [ ] `src/core` imports nothing from the UI.
