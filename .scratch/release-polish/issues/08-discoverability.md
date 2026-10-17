# Make the features easier to discover

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Build menu: search, clear categories, and a preview of the next Unlock (a new `NextBuildingUnlock` card, built on the Citizen thresholds `NextUnlock` already uses).
- [x] Explanatory empty states in the panels and management views where an action is blocked (no Workshop, full Storehouse, and so on), saying what to do.
- [x] First-use hints, dismissable, with a seen flag that does not change the save envelope.
- [x] Consistent placement and labels for actions across the Building panels, FR and EN.
- [x] Works in the radial and left bar layouts; stories and tests updated.
- [ ] Built on the existing common components; migrates to tokens with issue 09.

## Progress

- Build menu: `BuildSearch` (flat result list, empty state), `NextBuildingUnlock` (next buildings, Citizens progress; decoration and green-space types excluded), first-use hint.
- Blocked actions now say why, with `BlockedReason` + `urbsReason`: Repaint, Home insulation, Solar retrofit, Production (all slots busy), Storehouse (full / empty), Marina (moorings full, no catch), Farm (field limit, no field).
- First-use hints: `hintsStore` keeps seen flags in `localStorage` (`urbtopia-hints`), outside the save; `FirstUseHint` on the build menu, Repaint and Production.
- Consistency pass on the Building panels: Collect now sits before Upgrade in the Home and Production panels (Upgrade closes every panel); Repaint is its own block above the footer actions instead of sitting inside the button row; the footer buttons carry words (`✥ Move`, `❌ Sell · +N`, also for Venue fixtures); EN "Rush" became "Finish now" to match FR "Finaliser".
- Not done: the Unlock preview could also show Goods through `NextUnlock`; the visual token migration waits for issue 09.
