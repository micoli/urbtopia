# Challenge stock in the save

Status: done - 2778 unit tests, tsc and eslint pass
Blocked by: 03
Spec: ../spec.md

## Acceptance criteria

- [x] Save field for the accepted Challenge and its stock; absent field means none, no migration (ADR 0003).
- [x] Core action to set units aside: debits the Storehouse, caps each line at its quantity, irreversible.
- [x] Stock complete detection; pure core, replayed identically by Catch-up (ADR 0002).
- [x] Unit tests: partial then complete, surplus refused, insufficient Storehouse, replay.
