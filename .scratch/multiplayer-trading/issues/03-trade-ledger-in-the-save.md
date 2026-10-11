# Trade ledger in the save

Status: done - tsc, vitest (incl. property tests) and build pass; ADR 0028
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Core commands to take a Lot out of the stock, put a Lot into it (refused without room or without Unlock), take Urbs out and put Urbs in; pure, no clock.
- [x] A trade ledger in the state: each operation recorded before its RPC, each Escrow credited locally at most once.
- [x] Save version bump, migration and frozen fixture (ADR 0003); ADR for the ledger written.
- [x] Unit and property tests: no loss and no duplication whatever the order of crashes and replays.
