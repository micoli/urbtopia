# Exactly-once reward and failure

Status: done - 2791 unit tests, 248 pgTAP tests, tsc and eslint pass
Blocked by: 04
Spec: ../spec.md

## Acceptance criteria

- [x] Declaring a complete stock calls the RPC, then credits the Urbs reward (2x the Market values of the goal) through the ledger of ADR 0028, exactly once across crashes and retries.
- [x] Event: the Medal is recorded server-side; the stock is consumed.
- [x] Expiry or failure clears the accepted Challenge and the stock, nothing refunded.
- [x] Tests: crash between RPC and credit, double declaration, past deadline, Event without Urbs.
