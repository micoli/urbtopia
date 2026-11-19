# District plan screen

Status: ready-for-agent
Blocked by: 04
Spec: ../spec.md

## What to build

The scene and the screen of the game, opened from the side panel of the Planning office.

## Acceptance criteria

- [ ] A scene of its own: a hexagonal prism per Hex built in code, coloured by category, with the existing low-poly models on it at a small scale.
- [ ] Phone gesture: touch a free cell next to a placed Hex, a ghost shows the score gained, a button turns the Hex by 60°, another validates it. No undo after validation, no drag and drop.
- [ ] The next two Hexes of the Deck are in view; the score, the Rank reached and the best score are shown.
- [ ] A game under way is resumed on reopening; the player can give up.
- [ ] Tokens from `src/tokens.css`, icons from `iconRegistry.ts`, `Dialog` for the confirmations, motion that stops under `prefers-reduced-motion` (ADR 0051).
- [ ] A browser test on `/?e2e`, run headed: play a full game and check the Rank.
