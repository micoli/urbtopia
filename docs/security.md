# Security

The repository is open source: anything committed or printed in a CI log is public forever. See [ADR 0016](adr/0016-ci-secrets-isolated-in-production-environment.md).

## Public and secret values

| Value | Public? | Where it lives |
| --- | --- | --- |
| Supabase project URL | Public | GitHub repository Variable `VITE_SUPABASE_URL`, `.env.local` |
| Supabase publishable key (`sb_publishable_...`, legacy `anon`) | Public by design: data is protected by row-level security and the `urb_*` functions, never by this key | GitHub repository Variable `VITE_SUPABASE_PUBLISHABLE_KEY`, `.env.local` |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, project ref | Secret | Secrets of the `production` GitHub Environment only |
| `service_role` / `sb_secret_...` key | Secret, never needed by this project | Nowhere. CI fails if it appears in `dist/` |

## Rules for contributors

- Never put a secret in a commit, a workflow `run:` line, a command-line argument or a log. Secrets reach a step only through its `env:`.
- Install the git hook with `npm install` (it runs `lefthook install`); it needs `gitleaks` (`mise install`). It scans staged changes before every commit.
- The validation workflow runs on `pull_request` with no secret. `pull_request_target` is forbidden.
- Third-party GitHub Actions are pinned by commit SHA; Dependabot keeps them fresh.

## Rotating a leaked secret

1. Revoke it at its source (Supabase dashboard: access token, database password reset, or API keys).
2. Generate a new one and replace it in the `production` Environment secrets.
3. Do not rewrite git history: the value is public from the moment it was pushed, revoking is what protects the project.

## Forks

A fork needs its own Supabase project: create it, apply `supabase/migrations/` with `supabase db push`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository Variables of the fork. Without them the game runs without the Cloud save.

## GitHub settings to enable manually

- [ ] Settings, Code security: enable **secret scanning** and **push protection**.
- [ ] Settings, Actions, General: **Require approval for first-time contributors** (or all outside collaborators).
- [ ] Settings, Actions, General: default workflow permissions set to **Read repository contents**.
- [ ] Settings, Environments: `production` restricted to `main` with a required reviewer (see the production deploy wizard).
