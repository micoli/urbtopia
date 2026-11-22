# Categories 10 and 11

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

Social and City management.

## Acceptance criteria

- [ ] Social Achievements unlock from the existing social Commands and need no extra server call.
- [ ] A Visit earns nothing; the "Visit" Achievement is earned when the player starts a Visit from their own City.
- [ ] One test per category completing it.

## Notes

Social and City management are mostly Signals, sent from where the action happens (`src/store/achievementSignal.ts`): Handle, Friend request and Trade offer through `createSocialActions`, Visit before it starts, a second City before the switch reloads the page, Cloud save when a push succeeds, Codex, Analytics view and Advisor. Donation, Challenge, Replan and Time skip are Commands. The Achievements that need the online services carry the `cloud` feature, so a build without them leaves them out of the category; the Advisor one carries the `advisor` flag. A Replan earns only through its `FinishReplan` Command. The Visit Achievement is earned from the player's own City, as the spec says.
