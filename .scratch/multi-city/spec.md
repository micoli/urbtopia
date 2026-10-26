# Multiple named Cities per Player account

Status: needs-triage

## Problem

A Player account has a single city: one local save (ADR 0003), one Cloud save history (ADR 0015), one Showcase and one Hall of fame entry. The player cannot start a second city without losing the first, cannot name a city, and cannot move Materials and Goods between cities they own.

## Decisions

Recorded in [ADR 0047](../../docs/adr/0047-cities-each-with-their-own-saves.md) and [ADR 0048](../../docs/adr/0048-shipments-between-own-cities-go-through-the-server-escrow.md). Vocabulary (City, City name, Shipment, and the updated Player account, Cloud save, Showcase, Hall of fame, Challenge) in `CONTEXT.md`.

### City

- A Player account owns one to three Cities. Each is a complete game: own Urbs, Storehouses, Seed, Difficulty, politics, Tutorial, Solidarity reserve, `tradeLedger`.
- Shared by all Cities of an account: Handle, Avatar, Friends, Groups, Medals.
- Only the open City is simulated; a closed City is frozen and Catch-up (48 h cap) applies when it is reopened.
- In-game City switcher; launch reopens the last City played.
- Creating a City starts from scratch: new Seed, chosen Difficulty, Tutorial.
- Deleting a City asks to type its name, deletes its Cloud save too, is impossible for the last City, and is refused while the City has an open Trade offer, a waiting Shipment (sent or received) or an accepted Challenge; the refusal lists what blocks.

### City name

- At most 32 characters, free text, unique among the account's Cities regardless of case, renamable at any time, visible to other players (Visit, Hall of fame), resettable by an Admin from the Back office.
- Default: the words of the Seed without digits, title-cased (`gently-amber-fox-4821` → "Gently Amber Fox"), suffixed " 2", " 3"… on collision within the account.

### Saves

- Per City: local save, backup, cloud meta (`baseRevision`, sync flags), Save conflicts, Cloud save of current + 9 previous versions.
- `urb_saves` keyed by `(user_id, city_id, revision)`; every ADR 0015 rule (caps, rotation, compare-and-swap) applies per City.
- Upgrade: the existing save becomes the first City, named after its Seed by default.
- Export saves the open City; import always creates a new City (name from the file, deduplicated), refused at three Cities, never overwrites an existing City.

### Social

- Showcase per City, opt-out per City. Visit lets the visitor pick among the account's Cities that have a Showcase.
- Hall of fame ranks Cities, not accounts: one account may have several entries. An entry shows Avatar, Handle, City name, Citizens.
- Trade offer: sent from the open City, accepted into the City open at acceptance time. Payment received, and Lot or price returned on refusal or expiry, go back to the City the effect left, claimed when that City is next opened.
- Challenge: accepted per City, at most one accepted Challenge per City; several Cities of one account may accept the same Challenge. Challenge stock comes from that City's Storehouse. Abandon closes it for that City only. Time skip is refused only in a City with an unfinished accepted Challenge.
- Donation fills the giving City's Solidarity reserve and counts towards the account's Medals.

### Shipment

- A Lot (up to 10 lines of Materials and Goods) sent from one City to another City of the same account. No price, no Urbs, no Seed packs, no buildings.
- Goes through the server Escrow and the trade ledger (exactly-once). Requires being online; does not require a Handle or an email.
- No travel delay: claimed when the destination City is next opened online. Waits in the Escrow while the destination Storehouse lacks room (with a notice), never expires, cancellable by the sending City until claimed.
- Caps: 5 waiting Shipments per sending City, 30 Shipments per account per day. ADR 0029 growth caps remain the last guard for the Hall of fame.

## Out of scope

More than three Cities (needs IndexedDB behind `SaveStore`), simulating closed Cities, Urbs transfers between Cities, Shipments between different Player accounts (that is a Trade offer), a travel time for Shipments.

## Issues

1. `01-city-id-in-local-saves` - per-City save, backup and meta keys, migration of the existing save, City registry
2. `02-cloud-saves-per-city` - `urb_saves` keyed by `city_id`, RPC, pgTAP, sync per City
3. `03-city-switcher-and-lifecycle` - create, switch, rename, delete with blockers, default City name
4. `04-export-import-as-new-city` - export open City, import into a new City
5. `05-showcase-and-hall-of-fame-per-city` - Showcase per City, opt-out per City, Visit picker, Hall of fame entries
6. `06-challenges-per-city` - accepted Challenge bound to a City
7. `07-trade-offers-across-cities` - Trade offer effects routed back to the originating City
8. `08-shipment-escrow-rpc` - Shipment Escrow schema and RPC, caps
9. `09-shipment-ui` - send, pending, cancel, claim on open
10. `10-back-office-cities` - list Cities per account, reset a City name
