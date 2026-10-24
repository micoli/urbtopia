# Visit a Showcase read-only

Status: done - implemented
Blocked by: 02, 04
Spec: ../spec.md

## What to build

The Visit: load a Showcase into a throwaway in-memory game, read-only through the Command gateway, and return to the player's own city untouched.

## Acceptance criteria

- [ ] The Showcase goes through `parseEnvelope`: a newer format shows an "update the game" message; an older one is migrated in memory only, never written to `urb_saves` or the Showcase.
- [ ] During a Visit the game clock does not advance, no Command is applied, no build tool is offered; camera and inspection stay free.
- [ ] Autosave, Cloud sync, tab ownership and the local save are untouched; the Visit state is never persisted.
- [ ] A visible banner names the visited Handle with a "Leave" button; leaving restores the player's own game exactly as it was, including selection and camera.
- [ ] Anonymous accounts can Visit.
- [ ] Core isolation test still passes; unit tests on the guard and an end-to-end test (`/?bypass-tutorial`) from the list to a Visit and back.
