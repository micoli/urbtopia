# Shipment Escrow and RPC

Status: done - implemented
Blocked by: 02
Spec: ../spec.md

## What to build

Server side of the Shipment (ADR 0048): an Escrow between two Cities of the same account.

## Acceptance criteria

- [x] `urb_`-prefixed table and RPC to create, list, cancel and claim a Shipment, idempotent on a client-generated id.
- [x] Lot of at most 10 lines of Materials and Goods; no Urbs, Seed packs or buildings.
- [x] Sender and destination must be distinct Cities of the caller's account; works for accounts without Handle or email.
- [x] No expiry; cancellable by the sending City until claimed; single claim.
- [x] Caps: 5 waiting Shipments per sending City, 30 per account per day.
- [x] pgTAP covers every rule; TypeScript types regenerated.
