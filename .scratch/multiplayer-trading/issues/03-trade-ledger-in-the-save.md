# Trade ledger in the save

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] Core commands to take a Lot out of the stock, put a Lot into it (refused without room or without Unlock), take Urbs out and put Urbs in; pure, no clock.
- [ ] A trade ledger in the state: each operation recorded before its RPC, each Escrow credited locally at most once.
- [ ] Save version bump, migration and frozen fixture (ADR 0003); ADR for the ledger written.
- [ ] Unit and property tests: no loss and no duplication whatever the order of crashes and replays.
