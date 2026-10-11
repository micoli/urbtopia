# Handle onboarding UI

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## What to build

A "Friends" tab on the city management page that walks an account to multiplayer: attach an email (existing magic-link flow), then choose a Handle, with the "findable by email" setting.

## Acceptance criteria

- [ ] Tab hidden or disabled when cloud is unavailable; solo flow unchanged.
- [ ] Anonymous account: explains and launches the email flow; on return with an email, asks for a Handle.
- [ ] Handle form shows format errors, "taken" and "change allowed in N days" from the typed errors.
- [ ] Findable toggle (default on).
- [ ] FR/EN strings, one component per file, component tests with the fake client.
