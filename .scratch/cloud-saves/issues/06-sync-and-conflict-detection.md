# Sync and conflict detection

Status: ready-for-agent
Blocked by: 05
Spec: ../spec.md

## What to build

The synchronisation layer next to `SaveStore`, pushing the local save to the Cloud save and detecting a Save conflict. The envelope is unchanged: `baseRevision` lives in the local meta record.

## Acceptance criteria

- [ ] Push at most every 5 minutes while the local save is dirty, on `pagehide` with a keepalive request, and on demand.
- [ ] At startup, a newer Cloud save and an untouched local save loads the cloud one; a Cloud save newer than the app version is refused like a local one (`newer-version`).
- [ ] Diverged local and cloud (push refused and local modified since `baseRevision`) yields a Save conflict state, never an overwrite.
- [ ] Network failure never loses data or blocks the game; retried with backoff.
- [ ] The two-tab ownership token (`TabOwnership`) still prevents concurrent pushes from one browser.
- [ ] Logic tested with the fake client and an injected clock (no real timers or network), including: offline then online, two devices, conflict, newer-version cloud save.
