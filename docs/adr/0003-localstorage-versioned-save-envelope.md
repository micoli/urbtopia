# localStorage saves in a versioned envelope, derived data never saved

The single save lives in localStorage behind a `SaveStore` interface, wrapped in a versioned envelope `{ format, version, savedAt, state }`. Old versions are upgraded by a chain of pure migrations and the state is validated at the load boundary. The state holds lists (buildings, road segments), never per-cell grids, and derived data is rebuilt by the core on load.

## Why

- `pagehide` cannot await asynchronous writes; synchronous localStorage keeps the last save safe. A compact list-based state fits well under the ~5 MB limit even for a 250x250 city.
- Saves outlive app versions: explicit versions plus frozen fixtures make migrations testable and make a newer-than-app save refusable instead of corrupting it.
- Not saving derived data removes a class of desync bugs between saved and rebuilt values.
- IndexedDB was rejected for the MVP (async, more code); the `SaveStore` seam keeps it reachable.

## Consequences

- One save slot, one backup slot, one active tab (ownership token) in the MVP.
- If saves ever exceed the quota, swap the `SaveStore` implementation; the envelope does not change.
- Every change to the state shape requires a version bump and a migration with a fixture.
