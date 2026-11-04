# Advisor dialog and Explain button

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 03, 04

## What to build

The Advisor window opened from the Town hall, and an "Explain" button on each displayed Cause.

## Acceptance criteria

- [ ] A `Dialog` opened from the Town hall selection panel, only when the setting is on. One React component per file.
- [ ] Guided question buttons first; a free text field second, with a short length limit.
- [ ] Answers stream in; a stop button; a clear message when the model is loading or has failed.
- [ ] Answers are kept in memory only while the window is open: not in saves, exports, Cloud sync or social features.
- [ ] `DiagnosisPanel` shows an "Explain" button on each Cause when the setting is on; it opens the window with that Cause as the question.
- [ ] Game keeps running and stays responsive during an answer; the Advisor never issues a Command.
- [ ] Storybook stories (loading, streaming, error, empty) with the fake engine. Texts in `en` and `fr`.
