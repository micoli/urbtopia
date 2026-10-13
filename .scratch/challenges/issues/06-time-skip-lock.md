# Time skip lock during a Challenge

Status: done - unit tests, tsc and eslint pass
Blocked by: 04
Spec: ../spec.md

## Acceptance criteria

- [x] `SkipTime` is refused in the core while a Challenge is accepted and unfinished; Catch-up unaffected.
- [x] The +12 h quadruple-click on the clock and the Settings skip buttons are disabled with a tooltip "Challenge in progress" (FR/EN).
- [x] Tutorial step skips are refused too.
- [x] Unit tests and a component test.
