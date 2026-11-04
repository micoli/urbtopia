# Settings: opt-in, download, delete

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

The "Advisor" setting: off by default, hidden without WebGPU, download after a confirmation, deletion of the cached model.

## Acceptance criteria

- [ ] A preference in `prefsStore` (off by default), with its settings row. The row is not shown at all when the engine reports "unsupported".
- [ ] Turning it on opens a confirmation (`Dialog`) stating the model size; nothing is downloaded before the Player confirms; cancelling leaves the option off.
- [ ] Download progress is shown; an error (out of memory, network) shows a clear message and switches the option off.
- [ ] "Delete the Advisor model" button, which calls `deleteModel()` and switches the option off.
- [ ] Texts in `src/i18n/catalog.ts`, `en` and `fr`. Tokens and `Icon` per ADR 0051.
- [ ] Tests with the fake engine for each path (unsupported, confirm, cancel, progress, failure, delete). No game-state change and nothing added to saves.
