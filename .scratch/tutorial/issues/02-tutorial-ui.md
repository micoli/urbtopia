# Tutorial banner and entry points

Type: task
Status: resolved
Blocked by: 01

## What to build

The step banner, the expected-tool highlight, the Skip and Time skip buttons, and the entry points (new game, menu replay), with FR/EN strings. See `../spec.md`.

## Acceptance criteria

- [x] One banner component, shown on layouts A, B and C.
- [x] The expected tool is highlighted in the build bar.
- [x] The contextual Time skip button appears only on steps 4 and 5.
- [x] Skip is available at any step and confirms before applying.
- [x] A new game starts the Tutorial, an import does not.
- [x] The menu's existing "New game" (behind its confirmation) replays the Tutorial, no separate button.
- [x] All strings exist in FR and EN.
- [x] Checked by eye in the browser on phone and desktop widths.
- [x] Typecheck, lint and the full test suite pass.

## Answer

`TutorialBanner` (in `Overlays`, so on layouts A, B and C), `tutorialGuide` and `data-guided` highlights on the dock, bottom bar, radial menu and flyout items. New game and first boot start the Tutorial, import and loading a save do not. A completion toast shows when the last step ends. Checked by eye in the browser (layout C, desktop width): banner, step counter and highlights render. Layouts A and B and phone width were not checked by eye. Typecheck, lint and the full test suite pass.
