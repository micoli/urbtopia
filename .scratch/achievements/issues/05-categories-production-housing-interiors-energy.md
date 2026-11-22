# Categories 1, 2, 4 and 5

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

Production and economy, Housing and growth, Interiors, Energy and water: the Achievements of the spec as data, with texts, Codex links and retro proofs.

## Acceptance criteria

- [ ] Each Achievement of these four categories declared and unlockable; the data test passes.
- [ ] Retro proofs for the ones marked yes or partly.
- [ ] One test per category completing it.

## Notes

This ticket also built the shared trigger machinery: counters (`kind:`, `building:`, `category:` and named ones), `command`, `sim` and `signal` triggers, and the `Signal` Command the interface sends (interior opened, Guided demonstration finished). Categories now live in `src/core/achievements/categories/`. Seeding of old saves proves more Achievements than before, so the frozen-fixture tests list them.
