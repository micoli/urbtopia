# Level selector and ghost rendering

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

The player switches the active Level from the dock or with `[` and `]`, and the map shows that Level.

## Acceptance criteria

- [x] Dock control Surface / -1 / -2, keys `[` and `]`, tooltip on first use; one active Level, build tools act on it only.
- [x] On -1 and -2 the ground is hidden, Surface Buildings are a flat translucent silhouette, no shadows; the active Level in full colour.
- [x] Silhouette replaced by hidden Buildings when the phone render budget is exceeded (ADR 0034).
- [x] Chunked per (Level, 16x16) (ADR 0001); the scene reads snapshots only.
- [x] Icons from `iconRegistry.ts`, tokens from `src/tokens.css`, a Storybook story for the selector.
