# Seeded Deck and game state

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

The Deck drawn from the game's Seed and the office, and the state of a game with its commands (place, give up, new game).

## Acceptance criteria

- [ ] The same Seed and office give the same Deck and the same Start hex, in every game; another office or another Seed gives another Deck.
- [ ] The Deck holds the number of Hexes of the Tier (24, 28, 32, 36, 40), and the next two are in view.
- [ ] Commands go through one module, like the interior commands (ADR 0083): place a Hex with a rotation, give up, start the next game.
- [ ] The game ends when the Deck is empty and gives its score; giving up keeps the best score.
- [ ] A better score replaces the best score and its layout; a worse one leaves them alone.
- [ ] The Rank is derived from the best score, the Tier and the thresholds of the data file.
- [ ] Tests: determinism, end of game, best score, give up, Rank thresholds by Tier.
