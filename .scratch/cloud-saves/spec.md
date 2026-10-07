# Cloud saves on Supabase

Status: ready-for-agent

## Problem

The single save lives in localStorage (ADR 0003): clearing the browser or changing device loses the city. The project is open source, so any credential committed or printed in CI logs is public forever.

## Decisions

Recorded in [ADR 0015](../../docs/adr/0015-supabase-cloud-save-mirror-with-rpc-only-writes.md) and [ADR 0016](../../docs/adr/0016-ci-secrets-isolated-in-production-environment.md). Vocabulary (Player account, Cloud save, Save conflict) in `CONTEXT.md`.

- Local save stays the source of truth; the Cloud save is a mirror, the game is fully playable offline or without Supabase.
- Player account: anonymous Supabase Auth, upgraded with an email magic link (same user id, data kept); the same email on another device signs in to that account, and the local city versus the account's Cloud save goes through the Save conflict dialog.
- Cloud save: current + 3 previous versions, written only through RPC (`urb_push_save`, `urb_list_saves`, `urb_restore_save`, `urb_delete_my_saves`).
- Every Postgres object (tables, functions, triggers, policies, indexes, types, cron jobs) is prefixed `urb_`.
- Save conflict detected with a server `revision` and compare-and-swap; `baseRevision` stored in the local meta record, never in the envelope. The player chooses; the loser becomes a previous version.
- Push at most every 5 minutes while dirty, on `pagehide` (keepalive), and by a manual button. History rotates at most once an hour.
- Size cap about 1 MB per save, 4 rows max per user, anonymous accounts inactive for 90 days purged by `pg_cron` (accounts with an email kept).
- Environments: local Supabase (Docker) for dev and CI tests, one production project. Staging deferred.
- CI: validate on `pull_request` (no secrets), deploy migrations on `main` through the `production` GitHub Environment (reviewer approval), generate and check TypeScript types.
- Secrets only in the `production` Environment; Supabase URL and publishable key are GitHub Variables; `gitleaks` in pre-commit and CI; actions pinned by SHA; `pull_request_target` forbidden.
- `supabase-js` loaded through dynamic `import()`; cloud code in `src/persistence/cloud/` behind `CloudSaveClient`; `src/core` untouched.

## Out of scope

Multiple named cities, CAPTCHA on sign-up, a staging project, full `auth.users` deletion through an Edge Function, server-side validation of the game state.

## Issues

1. `01-supabase-schema-and-rpc` - tables, RPC, RLS, pgTAP
2. `02-ci-validation` - PR workflow with local Supabase, gitleaks, bundle grep
3. `03-repo-secret-guardrails` - pre-commit, `.env.example`, Dependabot, docs
4. `04-production-deploy` - Environment, `db push`, types generation (needs manual GitHub/Supabase setup)
5. `05-cloud-client-and-anonymous-auth` - `CloudSaveClient`, lazy `supabase-js`
6. `06-sync-and-conflict-detection` - cadence, `baseRevision`, conflict state
7. `07-cloud-save-ui` - conflict choice, history restore, delete data, status
