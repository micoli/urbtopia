# City id in local saves

Status: ready-for-agent
Spec: ../spec.md

## What to build

A City registry in localStorage and per-City save, backup and meta keys behind `SaveStore`, so the game can hold up to three Cities on one device (ADR 0047). The existing single save becomes the first City.

## Acceptance criteria

- [ ] A City has a stable client-generated id, a City name and its own save, backup and meta records (including cloud meta).
- [ ] The registry lists the account's Cities and remembers the last City played; launch opens it.
- [ ] Upgrading a device with the current single save moves it, its backup and its meta to the first City, named after its Seed by default; nothing is lost, and a fixture covers it.
- [ ] Only the open City is loaded and simulated; reopening a closed City applies Catch-up as today.
- [ ] Tab ownership still allows one active tab per device, whatever the City.
- [ ] Tested with `MemorySaveStore` and an injected clock: upgrade, two Cities, quota error on one City.
