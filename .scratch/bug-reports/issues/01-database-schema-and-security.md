# 01 - Database schema and security

Status: done

Spec: [spec.md](../spec.md) · ADR 0058

## What

One migration `supabase/migrations/<date>_urb_bug_reports.sql`:

- `urb_bug_reports` (id, author_id → `auth.users` cascade, description 1..4000, status `new|seen|resolved`, camera pose jsonb, context jsonb, city_id, city_seed, created_at, resolved_at, author_unread, admin_unread) with row level security on and all grants revoked.
- `urb_bug_report_attachments` (report_id cascade, screenshot text with a size check, city jsonb or gzipped base64 text capped at 2 MB, `city_encoding`).
- `urb_bug_report_replies` (report_id cascade, author `player|admin`, body 1..500, created_at).
- Client functions (security definer, empty search_path, email required, **no Handle required**): `urb_send_bug_report`, `urb_list_bug_reports`, `urb_get_bug_report` (also clears the unread flag), `urb_reply_to_bug_report`. Limit of 5 reports per day per account (`urb_bug_report_daily_cap`), replies refused once `resolved`.
- `urb_purge_bug_reports()` on pg_cron: 90 days after creation or 30 days after `resolved_at`.
- Admin reads, replies and status changes go through the service key (no client function).

## Done when

- `supabase/tests/database/urb_bug_reports.test.sql` covers: RLS on, anonymous (no email) refused, daily cap, size checks, an author sees only their own, replies refused when resolved, purge, cascade with the account.
- `urb_privileges.test.sql` lists the new client-facing functions.
- `npm run db:reset && npm run db:test && npm run db:lint` pass; `npm run db:types` regenerated.
