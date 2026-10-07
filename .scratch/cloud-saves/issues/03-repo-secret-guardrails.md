# Repository secret guardrails

Status: done - implemented; GitHub settings checklist is manual (docs/security.md)
Blocked by: none
Spec: ../spec.md

## What to build

Local and repository-level protections so a credential never enters the public history. Per ADR 0016.

## Acceptance criteria

- [ ] Pre-commit hook (lefthook) running `gitleaks` on staged changes, installed by `npm install` or a documented command, with a `.gitleaks.toml` allowing only the documented dummy values.
- [ ] `.env.example` with dummy `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; real `.env*` files gitignored.
- [ ] `.github/dependabot.yml` keeps pinned action SHAs and npm dependencies up to date.
- [ ] `docs/security.md`: which values are public (URL, publishable key) and which are secret, how to rotate a leaked secret (revoke and regenerate, no history rewrite), how forks configure their own Supabase.
- [ ] Documented checklist of GitHub settings to enable manually: secret scanning, push protection, approval for first-time contributors, default workflow permissions read-only.
