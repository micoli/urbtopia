# A Player account owns up to three Cities, each with its own local and Cloud saves

Accepted. Amends [ADR 0003](0003-localstorage-versioned-save-envelope.md) ("one save slot, one backup slot") and [ADR 0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md) (one Cloud save per Player account), which otherwise stay valid.

A Player account owns one to three Cities. Each City is a complete game: its own envelope, backup, cloud meta (`baseRevision`), Save conflicts and Cloud save history of ten versions. `urb_saves` is keyed by `(user_id, city_id, revision)` and every rule of ADR 0015 applies per City. Only the open City is simulated; the others are frozen and caught up by the usual Catch-up when reopened. The existing save becomes the first City on upgrade. The first City of every account has the fixed id `00000000-0000-0000-0000-000000000001` on every device, so Cloud saves written before Cities existed already belong to it and two devices of one account still meet in a Save conflict as before; other Cities get a random id.

## Why

- All Cities of a device share the ~5 MB localStorage quota of ADR 0003; three Cities with their backups keep each one well under it without moving to IndexedDB.
- Simulating closed Cities would need a second clock model; freezing them reuses Catch-up as is.
- Isolating saves per City keeps one City's Save conflict or restore from ever touching another.

## Consequences

- Raising the cap above three means swapping the `SaveStore` implementation first.
- Everything that was "one per Player account" must say whether it is per account or per City (Showcase and Hall of fame entries are now per City).
- Challenges are accepted per City, so one Player account can earn the same Daily challenge reward up to three times; accepted knowingly.
- The Hall of fame ranks Cities, not accounts, and [ADR 0029](0029-hall-of-fame-trusts-the-client-with-growth-caps.md)'s growth cap now also bounds a City's first publication: it enters the ranking at 500 Citizens at most and climbs from there. Otherwise a file import, which always makes a new City, would enter at any value. The name other players read is the City's own, replaced by its Seed-based default when it is empty, too long, contains a forbidden word or was reset by an Admin.
