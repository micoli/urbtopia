# CI secrets live only in a protected production environment

Accepted. The repository is open source: anything in a commit or a CI log is public forever.

- **Secrets** (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, project ref) are GitHub Environment secrets of `production`, restricted to `main` and gated by a required reviewer. Only the deploy job references that environment. No repository-level secret exists.
- **Untrusted code**: the validation workflow runs on `pull_request` (forks get no secrets) against `supabase start` in the runner. `pull_request_target` is forbidden. Default `permissions: contents: read`; first-time contributors need approval.
- **Public values**: the Supabase URL and publishable key are GitHub Variables injected at build, with a committed `.env.example` of dummy values. A CI script scans `dist/` for an `sb_secret_` key or a `service_role` JWT (the bare strings exist inside supabase-js, so a plain grep is not usable).
- **Logs**: secrets reach a step only through its `env:`, never as a CLI argument; no `set -x`, no echoing variables, no `--debug` on the production job. Third-party actions are pinned by commit SHA, kept fresh by Dependabot.
- **Detection**: GitHub secret scanning with push protection, `gitleaks` in CI on every push and PR, and a local pre-commit `gitleaks` hook. A leaked secret is revoked and regenerated; history is not rewritten.

## Why

- GitHub masks only exact secret values; transformed values (base64, URL-encoded) leak, so the rules avoid secrets reaching output at all.
- A branch or fork that cannot reference the `production` environment cannot read its secrets, whatever its workflow says.
- A compromised third-party action is the main supply-chain path to secrets; SHA pinning closes it.
- A pre-commit hook stops a secret before it enters the public history; CI catches contributors without the hook.

## Consequences

- Deploying to production waits for a manual approval.
- Anyone forking the project must create their own Supabase project and set their own variables and secrets.
