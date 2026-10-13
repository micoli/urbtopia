# Challenge client and polling

Status: done - 2765 unit tests, tsc and eslint pass
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [x] `ChallengeClient` interface in the spirit of `SocialClient`, a fake for tests and a Supabase implementation behind the dynamic `import()`.
- [x] Polling at the social rhythm (15 s while the Market modal is open; narrowed to the Events tab by issue 07, 60 s for the badge otherwise, stopped while the tab is hidden).
- [x] Daily variants are filtered client-side: for each difficulty, keep the highest band (min_citizens) the city reaches whose items are all unlocked; Events are kept when the city reaches their threshold and unlocks their items.
- [x] Tests with the fake client (filtering, acceptance, refusal when another Challenge is active, offline).
