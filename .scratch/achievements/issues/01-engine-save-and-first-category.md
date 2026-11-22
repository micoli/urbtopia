# Engine, save and first category with the window

Status: done - implemented
Spec: ../spec.md

## What to build

The module that latches Achievements by event through the Command gateway, the `achievements` field in the City save, the data format with FR/EN texts, and the Achievements window with one category (Transport) end to end.

## Acceptance criteria

- [ ] A trigger type set (`placed`, `created`, `command`, `sim`, `threshold`) raised after the gateway applied a Command or a simulation result.
- [ ] Latched ids stored in the save, never removed; an unknown id from a newer save is kept; save migration.
- [ ] Nothing acquired in a Visit or by a Replan; Tutorial placements count.
- [ ] Data test: every id has FR and EN texts and every trigger parameter exists in the game definitions.
- [ ] Window from the main menu: categories with a completion bar, Achievements, Citizens threshold or Difficulty shown, impossible ones greyed and left out of completion, a category with none possible hidden.
- [ ] Transport category (7 Achievements, the last one "On foot") works end to end; unit tests plus one e2e (`/?e2e`).

## Notes

Skipping the Tutorial earns nothing (it hands over the starting City). The window opens from a Trophy button of the dock. `created` triggers compare a state collection before and after a Command.
