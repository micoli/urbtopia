# Shipment UI and ledger

Status: done - implemented
Blocked by: 03, 08
Spec: ../spec.md

## What to build

Client side of the Shipment: send, follow, cancel, claim.

## Acceptance criteria

- [x] Send from the open City: pick a destination City and up to 10 lines; the Lot is debited through the trade ledger, then the RPC is called (persist-then-call).
- [x] The sending City lists its waiting Shipments and can cancel them; cancelled Lots return through the ledger.
- [x] Opening a City online claims its waiting Shipments; a Shipment that does not fit the Storehouse stays waiting with a notice.
- [x] Offline, sending is disabled with a clear message; unconfirmed ledger entries replay on reconnection.
- [x] FR/EN strings; tests with a fake client and an injected clock, including crash between debit and call.
