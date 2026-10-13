# Challenge client and polling

Status: needs-triage
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [ ] `ChallengeClient` interface in the spirit of `SocialClient`, a fake for tests and a Supabase implementation behind the dynamic `import()`.
- [ ] Polling at the social rhythm (15 s while the Events tab is open, 60 s for the badge otherwise, stopped while the tab is hidden).
- [ ] Variants are filtered client-side to those whose items are all unlocked in the city.
- [ ] Tests with the fake client (filtering, acceptance, refusal when another Challenge is active, offline).
