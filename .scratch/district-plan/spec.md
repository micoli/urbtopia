# District plan

Status: ready-for-agent

Decisions: [ADR 0090](../../docs/adr/0090-the-district-plan-is-a-hex-placement-game-run-from-a-planning-office.md). Vocabulary: `CONTEXT.md` (Planning office, District plan, Hex, Hex category, Deck, Start hex, Rank).

## Confirmed scope

- A new building, the Planning office, opens the District plan from its side panel. The game is a hex placement puzzle on its own screen, outside the city.
- The best score of an office gives a Rank, and the Rank gives the Homes within the radius of the office a bonus of Well-being.
- An office that is empty or never played leaves the city exactly as it was.

## Game rules

- A Hex has six typed edges using two Hex categories (Habitat, Park, Commerce, Industry, Service, Water); it is turned in steps of 60°.
- The board is hexagonal, in axial coordinates, with a radius of 4 around the Start hex, which the Deck imposes at the centre. Each Hex placed must touch a Hex already placed.
- A game uses a Deck of 24 Hexes at Tier 1 (28, 32, 36, 40 at Tiers 2 to 5), with the next 2 in view. No timer. It ends when the Deck is empty. A game can be given up; the best score is kept.
- The Deck is drawn from the game's Seed and the office, and every game of an office plays the same one: a better score comes from better placements, not from a better draw.
- Score: for each pair of touching edges, the value of the pair table (below). An edge that touches nothing counts for nothing.
- Rejeu at will; a better score replaces the best one.

| Pair of edges | Score |
| --- | --- |
| Habitat – Park | +3 |
| Habitat – Service | +2 |
| Habitat – Commerce | +1 |
| Habitat – Industry | −2 |
| Park – Water | +2 |
| Commerce – Service | +1 |
| Industry – Water | −1 |
| Same category | +1 |
| Any other pair | 0 |

All of these values live in `assets/defs/balance/districtPlan.json`, never in code.

## Reward

- Rank by best score: Bronze, Silver, Gold, giving 40 %, 70 % and 100 % of the cap of the Tier. The thresholds scale with the size of the Deck and are set in the data file.
- Starting values by Tier:

| Tier | Well-being cap | Radius (tiles) | Deck |
| --- | --- | --- | --- |
| 1 | 3 | 4 | 24 |
| 2 | 4 | 5 | 28 |
| 3 | 6 | 6 | 32 |
| 4 | 8 | 7 | 36 |
| 5 | 10 | 8 | 40 |

- A Home takes the best bonus among the offices that reach it; offices never add up.
- The bonus is capped by the Tier, never negative, and derived from the best score and the Tier: it is not saved.

## Planning office

- A building with Tiers (ADR 0004), unlocked at 150 Citizens, with a Build limit (thresholds of Citizens to be set when balancing) and an Escalating price, as the Farm.
- Its 3D model is made apart with the `create-building-model` skill. Until then, the building uses a placeholder model.

## Edge cases

- Demolishing an office removes its bonus and its entry in the save.
- A Tier raised during a game keeps the Deck of that game; the new cap applies at once to the best score; the next game uses the new Deck.
- Giving up a game leaves the best score alone; the next game has the next number.

## Save

- Per office: the game number, the Hexes placed in the game under way (position and rotation), the best score and the layout of the best score.
- Never the bonus, the Deck or the Rank. The save version goes up with a migration.

## Screen

- A scene of its own: a hexagonal slab built in code per Hex, its top split into six wedges coloured by category, with one existing low-poly model per category standing on it (house, apple tree, shop, workshop, school, water tower), fitted to the width of its edges. No third-party hexagon kit.
- On a phone: touch a free cell next to a placed Hex, a ghost shows the score gained, a button turns the Hex, another validates it. No undo after validation, no drag and drop.
- Motion uses the `--duration-*` and `--ease-out` tokens and stops under `prefers-reduced-motion`. Colours, radii and sizes come from `src/tokens.css`. Icons come from `iconRegistry.ts`. See ADR 0051.

## Teaching

- A guided demonstration of 6 Hexes (ADR 0080), a Guide page and a codex entry, in FR and EN.

## Out of scope

- The hexagonal grid is for this game only; it shares nothing with the square grid of the city.
- A cooldown, an undo, a score-proportional bonus and Hexes that copy the city's buildings were rejected (ADR 0090).
