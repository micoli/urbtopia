# Time skip lock during a Challenge

Status: needs-triage
Blocked by: 04
Spec: ../spec.md

## Acceptance criteria

- [ ] `SkipTime` is refused in the core while a Challenge is accepted and unfinished; Catch-up unaffected.
- [ ] The +12 h quadruple-click on the clock and the Settings skip buttons are disabled with a tooltip "Challenge in progress" (FR/EN).
- [ ] Tutorial step skips are refused too.
- [ ] Unit tests and a component test.
