# Shipment UI and ledger

Status: ready-for-agent
Blocked by: 03, 08
Spec: ../spec.md

## What to build

Client side of the Shipment: send, follow, cancel, claim.

## Acceptance criteria

- [ ] Send from the open City: pick a destination City and up to 10 lines; the Lot is debited through the trade ledger, then the RPC is called (persist-then-call).
- [ ] The sending City lists its waiting Shipments and can cancel them; cancelled Lots return through the ledger.
- [ ] Opening a City online claims its waiting Shipments; a Shipment that does not fit the Storehouse stays waiting with a notice.
- [ ] Offline, sending is disabled with a clear message; unconfirmed ledger entries replay on reconnection.
- [ ] FR/EN strings; tests with a fake client and an injected clock, including crash between debit and call.
