# local-auth URL parameter

Status: done - tsc and vitest pass; not run against a live local Supabase
Blocked by: none
Spec: ../spec.md

## What to build

`?local-auth=<email>` signs the player in without an email code, for manual debugging and Playwright. See the spec for the exact rules.

## Acceptance criteria

- [x] Works only when `import.meta.env.DEV` is true and the Supabase URL host is `127.0.0.1` or `localhost`; otherwise ignored silently, and absent from the production build.
- [x] Unknown email: account created (deterministic password from the email) and signed in; known email: signed in. The current session is replaced, an anonymous account is not upgraded.
- [x] Handle created from the email slug: whole email, `@` and `.` to `-`, valid format, cut to 20 characters with a 4-character hash suffix, numeric suffix on collision, never a forbidden word.
- [x] Local Supabase config has email confirmations off so `signUp` signs in at once (documented in `dev/supabase`).
- [x] Pure functions (slug, host check, password derivation) unit-tested; fake-client test for the create-or-sign-in flow.
- [x] `CLAUDE.md` "Browser tests" section documents the parameter next to `keep-local`.
