---
status: accepted
---

# The District plan is a hex placement game run from a Planning office

The interiors are all puzzles of flows on a closed grid. The District plan is a different kind of play: the player places Hexes drawn from a Deck on a hexagonal board and is scored on how well their edges fit. A finished plan gives the Homes around its **Planning office** a bonus of Well-being.

## Decisions

- **A building hosts the game, and anchors its reward.** The Planning office is a new building with Tiers (ADR 0004). It opens the District plan screen from its side panel, and the bonus applies to the Homes within its radius. It is unlocked at 150 Citizens and has a Build limit with an Escalating price, like the Farm. Overlapping offices never add up: a Home takes the best bonus that reaches it, as the yield of a Farm interior takes the best interior of the city (ADR 0086).
- **A dedicated screen, not the map.** The game never touches Parcels, roads or the simulation. It opens in its own scene, as a Management view does.
- **The Hex.** A hexagonal piece with six typed edges, using two Hex categories (Habitat, Park, Commerce, Industry, Service, Water), turned in steps of 60°. The word "tile" stays for the map, "lot" for a Trade, "parcel" for land.
- **The board.** It grows freely: each Hex must touch a Hex already placed, within a radius of 4 around a Start hex placed at the centre. The Start hex is imposed by the Deck.
- **A game.** A Deck of 24 Hexes at Tier 1, with the next 2 in view and no timer. It ends when the Deck is empty. Giving up keeps the best score. The Player may play again at will; a better score replaces the best one.
- **The Deck is drawn from the game's Seed and the game number**, the same way as the breakdowns of an interior: reproducible and testable, with no server.
- **Score.** Each pair of touching edges counts: the pair table of `districtPlan.json` (+3 Habitat with Park, +2 Habitat with Service, +1 Habitat with Commerce, −2 Habitat with Industry, +2 Park with Water, +1 Commerce with Service, −1 Industry with Water, +1 for the same Hex category, 0 otherwise). An edge that touches nothing counts for nothing. The table mirrors the rules of Well-being, so a good plan looks like a good neighbourhood. These are the starting values, balanced in the data file only.
- **Reward.** The score maps to three ranks, Bronze, Silver and Gold, that give 40 %, 70 % and 100 % of the cap of the Tier. The caps of a Tier are 3, 4, 6, 8 and 10 points of Well-being, over a radius of 4, 5, 6, 7 and 8 tiles: a tree gives 1 to 3 over 3 to 6 tiles, a sport field gives 10, and a Home interior caps at 5 to 12 for one Home. The Deck grows with the Tier (24, 28, 32, 36 and 40 Hexes). The rank thresholds scale with the Deck.
- **An empty or unplayed office changes nothing.** The bonus is capped by the Tier, never negative, and derived from the best score and the Tier, so it is not saved.
- **Edge cases.** Demolishing an office removes its bonus and its entry in the save. A Tier raised during a game keeps the Deck of that game, applies the new cap at once to the best score, and sizes the next game. A game that is given up leaves the best score alone.
- **Saved per office:** the game number, the Hexes placed in the game under way with their position and rotation (to resume on a phone), the best score and the layout of the best score. The save version goes up.
- **Gesture on a phone.** The player touches a free cell next to a Hex placed. A ghost shows the score gained; a button turns the Hex, another validates it. There is no undo after validation and no drag and drop.
- **Drawing.** A hexagonal prism built in code, coloured by Hex category, with the existing low-poly models standing on it at a small scale. No third-party hexagon kit.
- **Teaching.** A guided demonstration of 6 Hexes (ADR 0080), a Guide page and a codex entry, in FR and EN.

## Why

The play is different from the interiors on purpose: placing against a Deck needs foresight, not a circuit, and a game is short and can be put down on a phone. The reward reuses the Well-being the game already has, so nothing new is balanced against the economy, and the cap by Tier keeps replays from becoming a farm.

## Considered options

- **Play on the real map.** Rejected: it couples the game to Parcels, roads and the saves, and to the simulation's balance.
- **One Category per Hex.** Rejected: a uniform Hex has no useful rotation, so no puzzle.
- **A bonus proportional to the score.** Rejected: ranks are readable and leave one number to balance, the cap of the Tier.
- **A cooldown between games.** Rejected: it frustrates a thinking game and protects nothing, as the bonus is capped.
- **Hexes that copy the buildings of the city.** Rejected: it ties the game to the content of the save and fails on an empty city.
- **An undo after validation.** Rejected: the ghost and the confirm already prevent a slip of the finger, and an undo removes the weight of a choice.

## Consequences

- `CONTEXT.md` gains District plan, Planning office, Hex, Deck, Start hex and Rank.
- A hexagonal grid module (axial coordinates, six neighbours) is written for this game alone and shares nothing with the square grid of the city.
- `districtPlan.json` holds the pair table, the caps, the radii, the Deck sizes and the rank thresholds by Tier.
- The save holds the state of the games, never the bonus; the Well-being code reads the bonus through the Planning office.
- The 3D model of the Planning office is made apart, like every building (`create-building-model`).
- The spec and its six tickets are in `.scratch/district-plan/`.
