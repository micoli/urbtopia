# Casino balancing

Numbers live in `src/core/leisure/` (`casino.ts`, `slotMachine.ts`, `blackjack.ts`, `blockmatchRound.ts`). The tests in `casinoEconomy.test.ts` and the Minigame tests check them.

## Costs and Tiers

| Tier | Footprint | Model | Build / upgrade | Power Demand | Well-being radius (square side) | Well-being bonus | Highest Stake | Minigames |
|---|---|---|---|---|---|---|---|---|
| 1 | 2x2 | `2Story_Stairs_Mat` | 2 500 | 6 | 16 | 6 | 100 | slot machine |
| 2 | 3x2 | `2Story_Wide_Mat` | 4 000 | 9 | 20 | 7 | 500 | + blackjack |
| 3 | 4x2 | `2Story_Wide_2Doors_Mat` | 8 000 | 13.5 | 24 | 8 | 2 000 | + blockmatch |

- Stake steps: 10, 50, 100, 500, 1 000, 2 000, capped by the Tier.
- Power: 3x a theater (2) at Tier 1, +50% per Tier. A Home of Tier 5 draws 10, so a Tier 1 Casino costs about one Home of Tier 4 in power.
- Well-being: a theater gives 10; the Casino starts at 6 (60%), stacks with diminishing returns like Service coverage, and only counts while the Casino is powered. A Casino never penalises its absence.
- Unlocks at 250 Citizens, which is also where the city earns about 250 Urbs/hour of Tax at neutral Well-being (1 Urb per Citizen per hour). The Tier 1 Casino costs about ten hours of Tax; Tiers 2 and 3 about sixteen and thirty-two.
- Selling refunds the usual ratio of the build cost, so build-and-sell loses Urbs.

## Slot machine (Tier 1)

Three reels, six symbols with equal odds, out of 216 combinations:

| Outcome | Combinations | Pays (x Stake) | Share of the return |
|---|---|---|---|
| Three sevens | 1 | 20 | 9.3% |
| Three alike (not sevens) | 5 | 10 | 23.1% |
| A pair | 90 | 1.5 | 62.5% |
| Nothing | 120 | 0 | 0% |

RTP = (20 + 50 + 135) / 216 = 94.9%. The house edge is 5.1% of every Stake. One spin in 2.3 pays something, so a player sees wins often.

## Blackjack (Tier 2)

One player against the dealer, a fresh shuffled 52-card deck for each round. Hit, stand, double (first two cards only); no split, no insurance. The dealer draws to 16 and stands on 17, soft 17 included. A natural pays 3:2, a push returns the Stake.

Measured over 200 000 rounds:

| Play | Return on the money put down |
|---|---|
| Copy the dealer (hit below 17) | 94.2% |
| Basic strategy (double on 9-11, stand early against a weak card) | 99.5% |

Blackjack is a skill game: its return is not fixed at 95%. A casual player loses about 6% of the Stake per round, a careful one about 0.5%. This is the reason blackjack is the second Minigame, behind the pure-luck slot machine.

## Blockmatch (Tier 3)

The level depends on the Tier (level 4, 8 and 14 of block-match; only Tier 3 offers it), built from the round seed. A lost round loses the Stake; stars pay on top of the returned Stake: 1 star +25%, 2 stars +50%, 3 stars +100%.

Stars come from the moves left: 3 stars with at least 30% of the moves left, 2 stars with at least 12%, else 1. The break-even is therefore skill-dependent: with a win rate `w` and the star odds `s1, s2, s3`, the return is `(1 - w) * 0 + w * (1 + 0.25 s1 + 0.5 s2 + 1.0 s3)`. A player who wins 9 rounds in 10 with an even star split returns about 1.4 times the Stake, so blockmatch rewards skill: it is the only Minigame where the player can beat the house. Highest Stake 2 000, so the upside of a very good player is bounded by the Tier.

## Flow against the rest of the economy

- All Minigames settle in Urbs only; none creates Goods or Materials.
- A pure-luck player loses 5.1% of the money they stake. A player staking 100 Urbs a round at a rate of one round every 20 seconds loses about 15 Urbs a minute, in line with the Tax of a mid-sized Home block.
- The Stake is debited when a round starts (blackjack, blockmatch) and a round left unfinished loses it; the extra Stake of a double is charged at the end of the round and refused if the balance cannot cover it.
- Randomness comes from a dedicated stream of the game Seed advanced when the Stake is debited (ADR 0010). Reloading a save after a lost round gives the next draw, never the same one.
- Known gap: blockmatch results are reported by the screen (stars 0 to 3) rather than replayed by the core, unlike blackjack. Acceptable in a solo, serverless game; a replay of the move list would close it.
