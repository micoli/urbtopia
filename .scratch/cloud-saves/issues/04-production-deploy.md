# Production deploy of migrations

Status: ready-for-human - wizard and workflow written; the owner must run `scripts/production-wizard.sh`. `database.types.ts` is hand-written: run `npm run db:types` once Docker is available
Blocked by: 01, 02, 03
Spec: ../spec.md

## What to build

Deploy migrations to the production Supabase project from `main`, through a protected GitHub Environment, and keep generated TypeScript types in sync. Per ADR 0016. Part of this needs the owner in the GitHub and Supabase dashboards.

## Acceptance criteria

- [ ] Guided script (wizard) walks the owner through: create the Supabase project, create the `production` GitHub Environment restricted to `main` with a required reviewer, add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, project ref as Environment secrets, add the URL and publishable key as repository Variables.
- [ ] Deploy job on `main` references the `production` environment, links the project and runs `supabase db push`; secrets only in the `env:` of the step that needs them, no `--debug`, no echo.
- [ ] CI regenerates types (`supabase gen types`) and fails if the committed file differs.
- [ ] The Pages build reads the URL and publishable key from Variables.
- [ ] A dry run on a PR branch proves the deploy job cannot start (environment not allowed).
