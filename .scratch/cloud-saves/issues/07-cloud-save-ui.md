# Cloud save UI

Status: done - implemented
Blocked by: 06
Spec: ../spec.md

## What to build

The player-facing surface of Cloud saves, FR/EN, in the existing settings/save UI.

## Acceptance criteria

- [ ] Status indicator: synced, pending, offline, error, with last sync time.
- [ ] Save conflict dialog showing both cities (Citizens, last save time); the player picks one and the other becomes a previous version.
- [ ] Previous versions list with restore.
- [ ] "Delete my cloud data" with confirmation, which signs the Player account out.
- [ ] Manual "Save now" button.
- [ ] Cloud features are hidden when the cloud is not configured.
- [ ] Strings in FR and EN; component tests following existing UI tests.
