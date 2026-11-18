# Preferences ride in the save as plain keys and values

The save envelope gets an optional top-level `prefs` object, next to `state`: `{ format, version, savedAt, state, prefs }`. It holds every Preference as a plain key and value. It has no schema, no version and no migration, and the format version does not change.

## Why

- A Player who moves to another device through the Cloud save or an export expects the game to look the way they left it.
- A Preference is never read by the simulation, so it needs none of the guarantees of `state`: nothing is validated at the envelope, and a missing or unreadable `prefs` is an empty object.
- The City name already rides beside the envelope the same way (ADR 0047).

## Consequences

- `prefsStore` reads each value through `parsePrefs`: a key it does not know is ignored, an invalid value falls back to the default, a key the save lacks keeps the device's value. Adding, renaming or dropping a Preference never touches the save format.
- The save wins over the device's copy at load, at a cloud adoption and when the tab regains ownership. localStorage keeps a copy, so the game has its Preferences before any city is read.
- A change of Preference schedules a save, so the Cloud save follows it.
- Opening another City applies that City's Preferences. A City saved before this ADR has none and leaves the device's own.
- The Showcase envelope drops them: visitors never see a Player's Preferences.
- Other per-device stores (panel sections, demonstration speed, seen challenges…) still live in their own localStorage keys.
