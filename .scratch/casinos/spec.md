# Casinos (Leisure buildings)

Status: needs-triage

## Scope
- New family: **Leisure building** (not a Public facility, no Service category, no penalty when absent).
- First Leisure building: **Casino**, unlocked at 250 Citizens, several allowed, 3 Tiers paid in Urbs (build 2500, upgrades 4000 then 8000).
- Minigames by Tier: T1 slot machine, T2 blackjack, T3 blockmatch. A Casino offers all Minigames of its Tier and below.
- Max Stake by Tier: 100 / 500 / 2000. Fixed steps, never above the Urbs balance.

## Models (Quaternius buildings pack, `assets/quaternus/buildings.zip`)
- Tier 1: `2Story_Stairs_Mat`; Tier 2: `2Story_Wide_Mat`; Tier 3: `2Story_Wide_2Doors_Mat`.
- Measured proportions (width x depth, in 215-unit modules): T1 1.0 x 1.2, T2 1.8 x 1.05, T3 3.2 x 1.05.
- Footprint per Tier: 2x2 / 3x2 / 6x2 (depth 2, the Tier 3 model keeps its 3:1 proportions, like `HOME_FOOTPRINTS` for Homes). Model fitted to the footprint width. An upgrade needs the extra tiles free, else it is refused with the existing error and the panel says free space is needed.

## Energy
- Power Demand = 3x a theater at T1, +50% per Tier.
- Shed first when electricity falls short (before Homes). Not shed during an Adaptation period.
- Unpowered: Minigames unplayable and Well-being bonus off.

## Well-being
- Radius 8 / 10 / 12 by Tier, no Citizen capacity, all Homes in radius.
- Starting bonus ~60% of a theater. Several Casinos stack with diminishing returns.

## Money
- Stake debited at round start; lost if the round is left unfinished (confirmation before leaving). No in-progress save.
- No operating cost in Urbs, no Casino bankroll, balance never negative.
- Chance games target RTP ~95%.

## Minigames
- Slot machine: 3 reels, 6 symbols, simple pay table (pair / three alike / three sevens), no jackpot.
- Blackjack: one player vs dealer, fresh 52-card deck per round, dealer draws to 16 and stands on 17, natural pays 3:2, hit / stand / double only.
- Blockmatch: engine copied from ../block-match (pure engine, level generator, rng, types) into an isolated module. Level derived from (Seed, PRNG state), harder with Tier. Rounds independent, no progression. Loss = Stake lost. Stars win on top of the returned Stake: 1 star 25%, 2 stars 50%, 3 stars 100%.

## Randomness
- Dedicated PRNG stream of the game Seed, state serialized. Advanced when the Stake is debited. See ADR 0010.

## UI / content
- Casino panel (Minigames of its Tier, powered/shut state), Minigame in a full-screen modal, Stake chosen in the game panel before starting. No sound in v1.
- Codex: new "Leisure" category before decorations. No Tutorial step. FR/EN strings in existing i18n files.
- One React component per file.

## Open for implementation
- Balancing numbers go in `.scratch/casinos/balancing.md`.
- Add `docs/adr` entry only if blockmatch engine sharing changes (copy chosen for now).
