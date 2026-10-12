# Sanction alerts

Status: resolved
Blocked by: 03

Alert icon on sanctioned Homes in the scene and a badge on the city management button, in the style of the existing power-shortage warning. Hidden under Cozy. The existing power-shortage warning is unchanged.

Spec: `../spec.md`

## Comments

Resolved. `sanctionedHomes(state)` and `sanctionAlertKey(state)` in `src/core/environment/sanction.ts`; the alert refreshes at most once a minute of game time, or when the buildings, roads or Difficulty change. The icon is an HTML overlay (`src/ui/sanction/`), like the Collect badges. The badge of the city management button counts sanctioned Homes.

The city management button used to show the pending social requests, a copy of the Social button's badge (`c9b6b29`). It now shows only the sanctioned Homes; the Social button keeps its own badge.
