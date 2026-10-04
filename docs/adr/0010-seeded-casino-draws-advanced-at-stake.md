# Casino draws come from the Seed and advance when the Stake is debited

Chance in Minigames (slot reels, blackjack cards, blockmatch levels) draws from a dedicated stream of the game's seeded PRNG, whose state is serialized with the save (ADR 0002). The stream advances at the moment the Stake is debited, before any result is shown. A round left unfinished loses its Stake and is never saved.

## Why

- The Seed must keep fixing every chance-based outcome of a game, casino included.
- Reloading a save taken before a round replays the same draws, so a player could reload until a good draw. Advancing and persisting the state at Stake time means a reload after a losing round hands out the next draw, never the same one.
- Dropping in-progress rounds avoids a second save shape, and a lost round costs its Stake like a lost round.

## Consequences

- Saves taken before the Stake can still be reloaded to dodge a bad run: accepted, solo game.
- Alternatives rejected: an unseeded RNG for the casino (the Seed would no longer fix every outcome), advancing the state only at round end (allows replaying the same blackjack hand by reloading mid-round).
