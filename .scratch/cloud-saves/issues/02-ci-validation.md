# CI validation workflow

Status: done - implemented; workflows not yet run on GitHub
Blocked by: 01
Spec: ../spec.md

## What to build

A workflow triggered by `pull_request` and pushes that validates the database and scans for secrets, with no secret needed, so fork PRs run it. Per ADR 0016.

## Acceptance criteria

- [ ] Triggers on `pull_request` only (never `pull_request_target`); top-level `permissions: contents: read`.
- [ ] Starts a local Supabase in the runner, applies all migrations from scratch and runs `supabase test db` and `supabase db lint`.
- [ ] `gitleaks` scans the PR commits and the push range and fails on findings.
- [ ] After a build with dummy Supabase variables, `scripts/checkBundle.ts` fails if `dist/` contains an `sb_secret_` key or a `service_role` JWT (the bare strings appear inside supabase-js itself, so a plain grep cannot be used), or if supabase-js ended up in the main entry chunk.
- [ ] Every third-party action is pinned by commit SHA.
- [ ] The existing `deploy.yml` keeps working and also has least-privilege permissions per job.
