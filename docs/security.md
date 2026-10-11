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

## Supabase Auth settings (production project)

The Player account can be upgraded with an email, confirmed by a one-time code the player types in the game (ADR 0027). In the Supabase dashboard, Authentication:

- [ ] Sign In / Providers: **Allow anonymous sign-ins** on, **Confirm email** on (without it anyone could attach someone else's email to their account).
- [ ] Email OTP: length **6**, expiration **900** seconds. `scripts/push-email-templates.sh` sends both with the templates (`mailer_otp_length`, `mailer_otp_exp`).
- [ ] Email Templates: the local `config.toml` applies them only to the local stack. Send them to production with `SUPABASE_ACCESS_TOKEN=... scripts/push-email-templates.sh <project-ref>` (add `--dry-run` to preview; the token needs write access to the Auth configuration), or paste `supabase/templates/email_change.html` into "Change email address" and `supabase/templates/magic_link.html` into "Magic link" in the dashboard. Do not use `supabase config push`: it would also overwrite the production site URL and redirect URLs with the local ones. The templates show `{{ .Token }}` (the code) and no link: keep it that way, a link would open another tab in embedded browsers.
- [ ] SMTP: the built-in mailer is meant for testing only; configure a custom SMTP provider before opening to real players.
- [ ] Rate limits: keep the default email limits; the game reports "too many emails" instead of retrying.
- [ ] Attack Protection: enable a CAPTCHA (Cloudflare Turnstile) before opening to real players. Anonymous sign-ins are only bounded by 30 per hour and per IP, and each anonymous account may store 5 Cloud save revisions of up to 1 MB until it is purged after 90 days of inactivity.

## Accepted risks

- **Email to Handle**: a friend request by email always answers the same way, but once created it shows the target's Handle in the sender's outgoing requests, so a player learns which Handle an email belongs to. It is bounded by 30 searches per day per account with a confirmed email, and a player opts out with `findable = false`.
- **Trades trust the client** (ADR 0025): the server never checks stocks or Urbs, so a modified client, or two accounts working together, can create materials and Urbs through Trade offers. Acceptable as long as no leaderboard or shared economy depends on a city's resources.

## GitHub settings to enable manually

- [ ] Settings, Code security: enable **secret scanning** and **push protection**.
- [ ] Settings, Actions, General: **Require approval for first-time contributors** (or all outside collaborators).
- [ ] Settings, Actions, General: default workflow permissions set to **Read repository contents**.
- [ ] Settings, Environments: `production` restricted to `main` with a required reviewer (see the production deploy wizard).
