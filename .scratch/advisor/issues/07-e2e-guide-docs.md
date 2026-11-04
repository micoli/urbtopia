# E2E, Guide article and docs

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 05, 06

## What to build

The end-to-end test with the fake engine, and the player-facing documentation.

## Acceptance criteria

- [ ] Playwright test on `/?e2e` (run with `--headed`): turn the setting on, confirm the download, open the Advisor from the Town hall, ask a guided question, see the fake engine's answer, then click "Explain" on a Cause.
- [ ] Same test: with the fake engine set to fail, the error is shown and the option is switched off.
- [ ] A Guide article (and Codex page if the other systems have one) explaining the Advisor in the Guide's own voice: optional, local, one download, what it can and cannot do.
- [ ] `CONTEXT.md` Advisor entry rechecked against what shipped; README mention of the optional WebGPU requirement.
