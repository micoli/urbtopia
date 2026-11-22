# Medal of a category

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Award a Medal when a City completes a category (ADR 0094).

## Acceptance criteria

- [ ] Supabase migration and `urb_` RPC: record a Medal by category id, once per Player account, idempotent; pgTAP tests; types regenerated.
- [ ] Client behind the existing client interface; no account or offline: queued and sent at the next synchronisation.
- [ ] Medal names FR/EN, shown by the existing Medal list in the Social window.
- [ ] A category with no possible Achievement under the Difficulty gives none.
