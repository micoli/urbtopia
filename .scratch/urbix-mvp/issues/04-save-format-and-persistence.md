# Save format and persistence

Type: grilling
Status: resolved
Blocked by: 03

## Question

Decide where saves live (localStorage vs IndexedDB, size limits), the JSON schema and its versioning/migration, autosave cadence, export/import flow and validation of imported files, and recovery from corrupted saves.

## Answer

- **Backend**: localStorage behind a `SaveStore` interface (get/put/remove), so IndexedDB can replace it later. Synchronous writes survive `pagehide`. `QuotaExceededError` raises an alert and offers export.
- **Slots**: one save slot in the MVP. "New game" asks for confirmation and offers export first. Multi-slot stays in the fog.
- **Envelope**: `{ format: "urbtopia-save", version: <int>, savedAt, state }`. Pure ordered migrations `vN -> vN+1`, tested with frozen fixtures per version. Runtime validation of `state` at the load boundary. A save newer than the app is refused and never overwritten.
- **State shape**: lists, not cells. Buildings `{id, type, x, y, rotation, tier, slots...}`, roads as compact segments/runs, `nextId` counter saved. Derived data (occupancy grid, power/water totals, spatial index) is never saved and is rebuilt by the core on load.
- **Autosave**: debounce 2 s after any state-changing command, plus a 30 s tick while dirty (passive production changes state without a command), plus `visibilitychange` hidden and `pagehide`. Never per 1 Hz tick.
- **Export/import**: export downloads `urbtopia-<seed>-<date>.json` (same envelope). Import = file picker, parse, format check, migrate, validate, confirm "replace current city?". The previous save goes to the backup slot first. No clipboard copy.
- **Import timing**: import follows the reopen path: `advance(now)`, 48 h cap, backward clock clamped (ADR 0002). No anti-cheat.
- **Corruption**: backup key `urbtopia-save-backup`, refreshed every ~10 min and before import or migration. On load failure: never delete silently; show a screen with restore backup / export raw data / new game (confirmed).
- **Multi-tab**: single active tab. Ownership token in localStorage plus `storage` event; the last opened tab takes over, others become read-only with a banner and a "resume here" button that reloads state from storage.
- **Eviction**: call `navigator.storage.persist()` on first save (best effort). Discreet export reminder if last export is older than 14 days and the city progressed. PWA install stays in the fog.
- ADR: [0003](../../../docs/adr/0003-localstorage-versioned-save-envelope.md).
