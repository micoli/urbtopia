# 01: Casino and slot machine end to end

**What to build:** The player can build a Casino once the city reaches 250 Citizens and play the slot machine in it with Urbs. The Casino is a Leisure building: it raises Well-being around it, consumes much power and shuts down when unpowered. The slot machine draws from a dedicated stream of the game Seed, advanced when the Stake is debited.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New "Leisure" section in the build menu; Casino locks below 250 Citizens and an Unlock notification announces it.
- [ ] Casino is a Leisure building, not a Public facility: no Service category, no penalty when absent. Several Casinos can be built.
- [ ] Casino costs 2 500 Urbs, has Tier 1 only for now, uses the Quaternius `2Story_Stairs_Mat` model (registered in the install script like the farm pack, converted to GLB). Footprint 2×2 at Tier 1, model fitted to the footprint width.
- [ ] Power Demand is 3× a theater; the Casino is shed first on shortage, before Homes, and not shed during an Adaptation period.
- [ ] Well-being bonus on every Home within radius 8 (no Citizen capacity), about 60% of a theater, stacking across Casinos with diminishing returns.
- [ ] Casino panel lists its Minigames and shows powered/shut state; a shut Casino cannot start a round and gives no Well-being bonus.
- [ ] Slot machine: 3 reels, 6 symbols, pay table (pair / three alike / three sevens), RTP about 95%, no jackpot. Opens in a full-screen modal.
- [ ] Stake chosen from fixed steps before starting (max 100 at Tier 1), never above the Urbs balance; debited at round start; leaving a running round asks confirmation and loses the Stake.
- [ ] Casino draws use a dedicated PRNG stream of the Seed, serialized in the save, advanced at Stake time (ADR 0010); reloading after a lost round gives the next draw, never the same.
- [ ] Pure core logic (draw, payout, Stake debit) is tested headless with the injected clock; RTP is checked by a deterministic simulation test.
- [ ] One Codex entry in a new "Leisure" category placed before decorations; FR/EN strings in the existing i18n files.
- [ ] Save version bumped; older saves load with no Casino and a fresh casino PRNG stream.
