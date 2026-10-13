# Challenge client and polling

Status: needs-triage
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [ ] `ChallengeClient` interface in the spirit of `SocialClient`, a fake for tests and a Supabase implementation behind the dynamic `import()`.
- [ ] Polling at the social rhythm (15 s while the Events tab is open, 60 s for the badge otherwise, stopped while the tab is hidden).
- [ ] Daily variants are filtered client-side: for each difficulty, keep the highest band (min_citizens) the city reaches whose items are all unlocked; Events are kept when the city reaches their threshold and unlocks their items.
- [ ] Tests with the fake client (filtering, acceptance, refusal when another Challenge is active, offline).
