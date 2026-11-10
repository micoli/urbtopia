# Start, Cancel and Finish commands, with their refusals

Status: ready-for-agent
Blocked by: 01, 02, 03, 05

- `StartReplan` lifts everything into the Stash and keeps the starting layout. Refused during a Challenge, the Tutorial or an open Save conflict, each with its own reason.
- `CancelReplan` restores the starting layout exactly (same ids, Tiers, interiors, lines).
- `FinishReplan` is refused while the Stash is not empty; on success it clears the Replan and returns the Buildings with no Road or power.
- Free: no Urbs gained or lost, Build limits and Escalating prices unchanged.
- Done when: tests of every refusal, of Cancel restoring a mixed city exactly, and of Finish; `tsc`, lint and tests pass.
