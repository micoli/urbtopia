# Challenge stock in the save

Status: needs-triage
Blocked by: 03
Spec: ../spec.md

## Acceptance criteria

- [ ] Save field for the accepted Challenge and its stock; absent field means none, no migration (ADR 0003).
- [ ] Core action to set units aside: debits the Storehouse, caps each line at its quantity, irreversible.
- [ ] Stock complete detection; pure core, replayed identically by Catch-up (ADR 0002).
- [ ] Unit tests: partial then complete, surplus refused, insufficient Storehouse, replay.
