# Show programming UI

Status: resolved
Spec: ../spec.md
Blocked by: 04, 05

## What to build

From the panel of a Theater, Concert hall or Colosseum: schedule a Show, see cost, cooldown and expected crowd, and a toast when it starts and ends.

## Acceptance criteria

- [x] Uses Dialog and ActionButton; FR and EN texts.
- [x] Playwright test: schedule a Show, see the toast.
- [x] Cooldown and cost shown before confirming.

## Comments

No confirmation Dialog: the cost sits on the schedule button and the cooldown replaces the form, so nothing is hidden before the player commits. A time skip now also moves the Gathering and its cooldown.
