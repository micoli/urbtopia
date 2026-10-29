# Attraction side panel, Guide and e2e

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 02, 03

## What to build

Side panel of an Attraction: Ticket selector, Takings with a collect button, Tourists per day. Guide entries (prerendered from definitions), Codex entry, FR and EN texts, one Playwright test.

## Acceptance criteria

- [ ] Panel uses shared components and tokens (ADR 0051); icons registered.
- [ ] FR and EN strings for every new text.
- [ ] Playwright test (`?e2e`, run headed): build a Museum, see Takings, collect them.
