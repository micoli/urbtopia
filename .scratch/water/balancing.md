# Water balancing

Source of truth for the numbers is the code: `src/core/water/` (`waterTiles.ts`, `boats.ts`, `fishing.ts`, `bridges.ts`, `bridgeOpenings.ts`, `marina.ts`). The tests in the same folder check them.

Yardstick: the Tax is 1 Urb per Citizen per hour, so a city earns about as many Urbs per hour as it has Citizens. A building is priced in hours of Tax at its unlock threshold (the Casino is about ten hours).

## Prices and unlocks

| Element | Unlock (Citizens) | Price (Urbs) | Hours of Tax at unlock | Tiers |
|---|---|---|---|---|
| Water tile | 40 | 10 per tile | 0.25 | none |
| Marina | 60 | 600 | 10 | 3 (Boat capacity 3 / 6 / 10, Fishing Slots 2 / 3 / 5) |
| Pleasure boat | 80 | 400 | 5 | none |
| Fishing boat | 100 | 800 | 8 | none (Slots come from the Marina Tier) |
| Bridge 1 / 2 / 3 / 5 tiles | 120 | 150 / 300 / 450 / 800 | 1.3 to 6.7 | none |
| Casino boat | 300 | 3 000 | 10 | same as the Casino (upgrades 4 000 and 8 000) |

A Water tile costs twice a Field tile (5), since a small harbour needs a score of them.

## Running costs

- **Pleasure boat**: 2 Urbs per hour. At its unlock the city earns 80 per hour, so one boat takes 2.5% of the Tax; its Well-being (+4, 12-tile square) is below a Casino (+6 to +8) or a stadium (+8).
- **Casino boat**: the price of powering a Casino of the same Tier through Backup power, `casinoPower(tier) × backupCost`: 3 / 4.5 / 6.75 Urbs per hour. A boat needs no power, so it pays that bill in Urbs instead.
- **Fishing boat**: none, it produces.
- Costs are collected once per Marina, summed over its Boats; when the city cannot pay, Pleasure boats and Casino boats stop acting.

## Fishing

- One Fish every 6 minutes per Fishing boat, like a Tier 1 Workshop making a 6-minute Material. The Slots of the Marina Tier are the cycles a boat can hold between two collections (2 / 3 / 5), so a Tier 1 Marina must be visited every 12 minutes to keep a boat working.
- Canned fish: 2 Fish and 5 minutes in a Factory, worth 80 Urbs. That is 80 for 17 minutes of chain, the same rate as Tools, which is what the Good order test (`balance.test.ts`) requires after its unlock at 100 Citizens.
- A boat working full time makes 10 Fish, hence 5 Canned fish, hence 400 Urbs per hour of Goods, against 8 hours of Tax for its price.

## Bridge openings

The capacity of every tile of a Bridge is multiplied by `1 − closed fraction`, where
`closed fraction = min(maxClosed, boats × openingsPerBoatHour × minutesPerOpening / 60)`
and `boats` counts the Boats on the same body of water as the Bridge (ADR 0019).

| Constant | Value |
|---|---|
| `openingsPerBoatHour` | 6 |
| `minutesPerOpening` | 1 |
| `maxClosed` | 0.5 |

One Boat closes a Bridge 10% of the time and five Boats reach the cap. In the scene a boat drifting near a Bridge asks for it every few tens of seconds and a crossing takes about a minute with the animation and the queue, which is what these values stand for. A Marina holds at most 10 Boats, so a Bridge never loses more than half of its capacity.

## To check by playing

- Whether 10% per Boat is too harsh next to a busy Bridge; lower `openingsPerBoatHour` first.
- Whether a Tier 1 Marina (2 Slots) makes fishing too tedious.
