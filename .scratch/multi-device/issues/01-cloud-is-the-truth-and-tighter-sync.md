# Cloud is the truth and sync is tighter

Status: done - implemented
Spec: ../spec.md
Blocked by: none

## What to build

A device opens a City from the latest Cloud save without asking when it was not played offline since the last sync. Push 30 s after an edit, on hidden and on page hide; compare revisions when the page becomes visible again.

## Acceptance criteria

- [ ] Returning to a visible page adopts a newer Cloud save silently when the local one is unedited.
- [ ] A push is sent 30 s after an edit, not every 5 minutes.
- [ ] Test on `FakeCloudSaveClient` with two devices: play on A, open B, B shows A's last state.
- [ ] A real divergence still raises the Save conflict dialog.
