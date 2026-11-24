# Active device lease and Takeover

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Migration and RPC `urb_claim_city` (lease of 2 min), renewed every 30 s with the push. The device that loses the lease goes read-only with a banner offering a Takeover; what it had not pushed is kept as a previous version. Two tabs of one browser stay arbitrated by the existing tab ownership; the device id lives in storage. Offline play needs no lease; on reconnection the three cases of ADR 0095 apply. The Save conflict dialog shows both sides (Citizens, Urbs, date).

## Acceptance criteria

- [ ] pgTAP test for the lease: claim, renew, expire, forced takeover.
- [ ] Unit tests on the fake client: two devices, takeover, lapsed lease, offline then reconnect (three cases).
- [ ] Banner and dialog texts in FR and EN, Dialog from `src/ui/common`, no emoji, motion respects `prefers-reduced-motion`.
- [ ] One Playwright test with two browser contexts: A plays, B takes over, A becomes read-only and its last edit is a previous version.
