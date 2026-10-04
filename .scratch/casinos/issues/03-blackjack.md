# 03: Blackjack

**What to build:** A Tier 2 Casino offers blackjack: the player plays one hand against the dealer with a Stake, using cards drawn from the Seed stream.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Blackjack unlocks at Casino Tier 2 and opens in the full-screen modal.
- [ ] One fresh shuffled 52-card deck per round, shuffled from the casino PRNG stream, advanced at Stake time (ADR 0010).
- [ ] Actions: hit, stand, double (doubling needs the extra Stake in the balance). No split, no insurance.
- [ ] Dealer draws up to 16 and stands on 17; natural blackjack pays 3:2; push returns the Stake.
- [ ] Stake debited at round start; leaving a running hand asks confirmation and loses the Stake; hands are never saved.
- [ ] Pure core hand logic tested headless, including dealer rules, natural, push, double and an RTP simulation.
- [ ] FR/EN strings; touch-friendly layout on phone.
