# Start, Cancel and Finish commands, with their refusals

Status: resolved
Blocked by: 01, 02, 03, 05

- `StartReplan` lifts everything into the Stash and keeps the starting layout. Refused during a Challenge, the Tutorial or an open Save conflict, each with its own reason.
- `CancelReplan` restores the starting layout exactly (same ids, Tiers, interiors, lines).
- `FinishReplan` is refused while the Stash is not empty; on success it clears the Replan and returns the Buildings with no Road or power.
- Free: no Urbs gained or lost, Build limits and Escalating prices unchanged.
- Done when: tests of every refusal, of Cancel restoring a mixed city exactly, and of Finish; `tsc`, lint and tests pass.

## Answer

Done. Commands `StartReplan`, `CancelReplan`, `FinishReplan` and `Replan { action }` (`src/core/replan/replanCommands.ts`; `ReplanAction` covers lift and place for Buildings, tiles, networks, Bridges and Boats). Start is refused when a Replan is under way (`error.replanActive`) or during a Challenge (`error.replanChallenge`); the Tutorial already blocks it through `tutorialAllows` (`error.tutorialLocked`). The Save conflict refusal is the UI's (ticket 07), as core does not know it. While a Replan lasts every command but `Replan`, `CancelReplan`, `FinishReplan` and the trade escrow ones is refused with `error.replanActive`, so Cancel cannot lose a change. Placing a Bridge over Water counts the Homes of the Stash towards its unlock. The Finish summary of Buildings without Road or power is ticket 08.
