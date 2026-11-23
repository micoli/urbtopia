# Toasts

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

A toast at each unlock and a distinct one for a Medal.

## Acceptance criteria

- [ ] One toast per unlock, grouped when several arrive in the same tick.
- [ ] A Catch-up lists the Achievements it earned in its return summary instead of toasting each.
- [ ] A separate Medal toast, same Icon family, no emoji.
- [ ] Motion stops under `prefers-reduced-motion`.

## Notes

The tick path now latches too (`withAchievements`). A Catch-up ends with one toast that lists what the absence earned. `announceMedal(category)` is ready for ticket 04.
