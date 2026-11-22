# Medal of a category

Status: done - implemented
Spec: ../spec.md
Blocked by: 01

## What to build

Award a Medal when a City completes a category (ADR 0094).

## Acceptance criteria

- [ ] Supabase migration and `urb_` RPC: record a Medal by category id, once per Player account, idempotent; pgTAP tests; types regenerated.
- [ ] Client behind the existing client interface; no account or offline: queued and sent at the next synchronisation.
- [ ] Medal names FR/EN, shown by the existing Medal list in the Social window.
- [ ] A category with no possible Achievement under the Difficulty gives none.

## Notes

`urb_record_achievement_medal(category, name_fr, name_en)` stores a Medal coded `achievements-<category>`, once per account, and returns whether it was newly earned. The client (`src/achievements`) keeps no queue: the waiting categories are the completed ones the server has not confirmed (`urbtopia:achievement-medals`), tried again every 30 s, on `online` and on sign-in. The player sees "Category complete" at once and "Medal earned" when the server confirms a new Medal. The pgTAP tests for `urb_showcase` and `urb_bug_reports` already fail on this machine's local database for reasons unrelated to this migration.
