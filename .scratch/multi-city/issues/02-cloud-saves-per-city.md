# Cloud saves per City

Status: done - implemented
Blocked by: 01
Spec: ../spec.md

## What to build

`urb_saves` and its RPC keyed by City, so each City has its own Cloud save history, revision and Save conflicts (ADR 0047, extending ADR 0015).

## Acceptance criteria

- [x] Migration adds `city_id` to `urb_saves` (key `(user_id, city_id, revision)`); existing rows are attached to the fixed first City id, which every device uses for its first City (see ADR 0047).
- [x] `urb_push_save`, `urb_list_saves`, `urb_restore_save` take a City id; caps (size, 10 versions, hourly rotation, compare-and-swap) apply per City; at most three Cities per account.
- [x] A RPC deletes one City's Cloud save; `urb_delete_my_saves` still deletes all.
- [x] The sync layer pushes and detects Save conflicts per City; a conflict on one City never touches another.
- [x] Signing in on a new device lists the account's Cities from the cloud and can restore each.
- [x] pgTAP covers the per-City rules; client logic tested with the fake client; TypeScript types regenerated.
