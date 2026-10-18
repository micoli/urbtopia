# Loop checkbox in the line editor

Type: task
Status: ready-for-agent
Blocked by: 01

## What to build

A "Loop" checkbox in `LineEditor`. See `../spec.md`.

## Acceptance criteria

- [ ] The checkbox sets or clears `loop` through the command of ticket 01.
- [ ] It is disabled with a reason under 3 stops.
- [ ] The line list shows a loop indicator; the failure messages cover the closing section.
- [ ] Texts in `en` and `fr`, story with a looped line.
- [ ] Typecheck, lint and the full test suite pass.
