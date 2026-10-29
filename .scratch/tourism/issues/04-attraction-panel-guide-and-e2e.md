# Attraction side panel, Guide and e2e

Status: resolved
Spec: ../spec.md
Blocked by: 02, 03

## What to build

Side panel of an Attraction: Ticket selector, Takings with a collect button, Tourists per day. Guide entries (prerendered from definitions), Codex entry, FR and EN texts, one Playwright test.

## Acceptance criteria

- [x] Panel uses shared components and tokens (ADR 0051); icons registered.
- [x] FR and EN strings for every new text.
- [x] Playwright test (`?e2e`, run headed): build a Museum, see Takings, collect them.

## Comments

Codex entries are generated from the building definitions and were not touched; the Guide has a Tourism article (EN, FR).
