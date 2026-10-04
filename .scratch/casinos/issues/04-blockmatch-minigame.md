# 04: Blockmatch

**What to build:** A Tier 3 Casino offers blockmatch, ported from `../block-match`. The player stakes Urbs, plays one generated level and is paid by the stars earned.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Pure engine copied from block-match (`game/engine`, `levelGenerator`, `rng`, `types`, `scoring`, `grid`, `gravity`, `effects`) into an isolated core module with its tests; no progress or best-score storage.
- [ ] Level is derived from the game Seed and the casino PRNG stream, advanced at Stake time (ADR 0010); difficulty grows with the Casino Tier.
- [ ] Defeat loses the Stake. Victory returns the Stake and adds 25% / 50% / 100% of it for 1 / 2 / 3 stars.
- [ ] Rounds are independent; leaving a running round asks confirmation and loses the Stake; rounds are never saved.
- [ ] React components ported one per file, in the modal, without the block-match language switcher or install prompt; touch input works on phone.
- [ ] Strings moved from block-match YAML to the urbix i18n files in FR/EN.
- [ ] Tests cover payout by star count and seeded level reproducibility.
