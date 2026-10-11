# Handle onboarding UI

Status: done - tsc, eslint, vitest and build pass
Blocked by: 02
Spec: ../spec.md

## What to build

A "Friends" tab on the city management page that walks an account to multiplayer: attach an email (existing magic-link flow), then choose a Handle, with the "findable by email" setting.

## Acceptance criteria

- [x] Tab hidden or disabled when cloud is unavailable; solo flow unchanged.
- [x] Anonymous account: explains and launches the email flow; on return with an email, asks for a Handle.
- [x] Handle form shows format errors, "taken" and "change allowed in N days" from the typed errors.
- [x] Findable toggle (default on).
- [x] FR/EN strings, one component per file, component tests with the fake client.
