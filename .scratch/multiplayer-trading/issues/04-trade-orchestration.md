# Trade orchestration

Status: ready-for-agent
Blocked by: 02, 03
Spec: ../spec.md

## Acceptance criteria

- [ ] Store actions to create, accept, refuse, cancel and claim, each persisting its ledger entry before the RPC.
- [ ] Replay of unfinished operations at start and on each poll until the server and the ledger agree.
- [ ] Tests with the fake client, including a lost answer and a crash between the debit and the RPC.
