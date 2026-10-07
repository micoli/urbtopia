# Supabase schema and RPC

Status: done - implemented; SQL and pgTAP not executed locally (no Supabase CLI / Docker): run `npm run db:start && npm run db:test` before relying on it
Blocked by: none
Spec: ../spec.md

## What to build

The `supabase/` project (config, migrations, tests) defining the `urb_saves` table and the RPC that are the only write path, per ADR 0015. Runs on a local Supabase (`supabase start`).

## Acceptance criteria

- [ ] `supabase/config.toml` committed with anonymous sign-ins enabled and rate limits set; no secret in it.
- [ ] Table `urb_saves` (`user_id`, `revision`, `format_version`, `envelope` jsonb, `client_saved_at`, `created_at`, `updated_at`); RLS enabled; clients have SELECT on own rows only and no direct INSERT/UPDATE/DELETE.
- [ ] `urb_push_save(base_revision, envelope, format_version, client_saved_at, keep_previous)` (`keep_previous` forces a new history row, used when resolving a Save conflict): compare-and-swap on revision (conflict error carrying the server revision), rejects envelopes over the size cap, keeps at most 4 rows per user, rotates history at most once an hour.
- [ ] `urb_list_saves`, `urb_restore_save`, `urb_delete_my_saves` exist and only touch the caller's rows.
- [ ] Every Postgres object created by the migrations (tables, functions, triggers, policies, indexes, types, cron jobs) is prefixed `urb_`; a pgTAP or lint check fails on an unprefixed object in the `public` schema.
- [ ] `pg_cron` job (`urb_purge_inactive_anonymous_users`) purges anonymous users inactive for 90 days, skipping accounts with an email.
- [ ] pgTAP tests (`supabase test db`): user A cannot read B; no JWT reads nothing; direct writes refused; 5th push never creates a 5th row; oversize refused; CAS conflict; purge skips email accounts.
- [ ] `supabase db lint` passes (no table without RLS).
- [ ] `npm run` scripts or `mise` tasks to start, reset and test the local database; README section for contributors.
