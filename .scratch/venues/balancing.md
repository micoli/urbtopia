# Venues: balancing

Placeholders to tune by play. Values live in `VENUE` and `ARCADE_FIXTURES` (`src/core/venues/`).

## Arcade revenue
- Reach radius 12 tiles around the Arcade; Visitors = Citizens of Homes in reach x 0.2 per hour.
- Reference price of a play: 2 Urbs; allowed 1 to 6. Acceptance = `1 - 0.2 x (price - 2)`, between 0 and 1.
- Capacity = sum of `playsPerHour` of the game Fixtures; halved without a counter.
- Served = min(accepted Visitors, capacity); earnings per hour = served x price.
- Takings cap by Tier: 400 / 900 / 1800 Urbs (Tax is capped at 8 h of production).
- Refund when removing a Fixture: 50% of its price.

## Fixtures (price, plays per hour, minimum Tier)
| Fixture | Price | Plays/h | Tier |
|---|---|---|---|
| Counter | 100 | 0 | 1 |
| Barrel climber | 150 | 6 | 1 |
| Space shooter | 180 | 8 | 1 |
| Air hockey | 220 | 4 | 1 |
| Table / Chair / Bar stool | 60 / 25 / 30 | 0 | 1 |
| Pinball | 300 | 6 | 2 |
| Billiard | 350 | 3 | 2 |
| Snack machine | 200 | 0 | 2 |
| Claw machine | 320 | 5 | 2 |
| Basketball | 400 | 6 | 3 |
| Dance machine | 500 | 8 | 3 |
| Prize wheel | 450 | 5 | 3 |
| Ticket machine | 350 | 0 | 3 |

## Building
- Unlock at 100 Citizens, cost 1200 Urbs, footprint 2x2.

## Layout rules (`LAYOUT`)
- Counter rate: 1 at distance 1 from the entrance, minus 6% per extra tile, floor 60%; 50% with no counter.
- Noise: each pair of adjacent loud machines costs 8% attractiveness, floor 50%.
- Seats: a chair needs a table next to it (a bar stool also a counter); 4 seats per table or counter; a seat adds 2 plays per hour.

## Staff (`STAFF`)
- Wages per day: manager 60, employee 30, technician 40, security 35 Urbs; paid per hour out of the Takings.
- Posts Tier 1/2/3: manager 1/1/1, employee 2/3/4, technician 1/1/2, security 1/1/2.
- Employee rate `min(1, 0.4 + 0.3 x employees)`; manager +10% yield and unlocks the price; no security: Visitors x 0.9.

## Wear (`WEAR`)
- Wear: 0.5 Condition points per play served; technician x0.6.
- Breakdown below Condition 40: chance `0.5 x (40 - condition) / 40` per game hour.
- Repair by hand: `0.6 x price x damage`; by a technician 60% of that, paid from the Takings.
