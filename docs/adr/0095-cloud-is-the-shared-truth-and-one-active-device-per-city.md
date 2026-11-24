---
status: accepted
---

# The Cloud save is the shared truth online, and one Active device plays a City at a time

Extends [ADR 0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md), which stays valid for the RPC-only writes, the compare-and-swap on a server-owned `revision` and the Supabase client. It replaces its rule that the local save is the source of truth in every case.

One player who owns several devices kept meeting a Save conflict against their own save. A push that reached the server but whose response was lost (page closed during a keepalive push, network drop) left the local `baseRevision` behind, and the next reconcile read the player's own latest save as a rival.

## Decision

- **Online, the Cloud save is the truth.** A device opens a City from the latest Cloud save without asking, as long as it has not been played offline since the last sync. The local save is the device's cache and keeps the game playable offline.
- **A local save equal to the Cloud save is never a Save conflict.** Equality is read on the client `savedAt`, not on the envelope text, because `jsonb` reorders keys.
- **One Active device per City, held by a server lease.** A new RPC `urb_claim_city` takes or renews the lease; the Active device renews it with every push and every 30 seconds, and it lapses after 2 minutes of silence. A device is a browser, identified by an id kept in its storage; two tabs of one browser stay arbitrated by the existing tab ownership.
- **A Takeover is always allowed.** The device that lost the lease learns it on its next contact and becomes read-only with a banner. What it had not pushed is set aside in the Cloud save by `urb_stash_save`, which any device may call: it lands in a table of its own (three kept per City), never becomes the current save, and shows in the version list with a negative revision that `urb_restore_save` reads as a stash. If the service is out of reach the work stays in the local save, and the next lease check tries again. The local backup slot is a single, rotating copy and is not relied on.
- **Offline play needs no lease.** On reconnection: nobody else advanced, the device reclaims the lease and pushes; another device advanced, it is a real Save conflict with both sides summarised; the Cloud save equals the local one, nothing happens.
- **Sync is tighter.** Push 30 seconds after an edit, on hidden, and on page hide; compare revisions when the page becomes visible again.
- **A Cloud save written by a device whose clock runs ahead is rebased** when adopted: `rebaseClock` brings `lastSeen` back to the device's `now` and shifts every running timer with it, so nothing stalls and nothing is replayed twice. A save written by a device whose clock runs behind still replays that gap in the Catch-up; measuring it against the server time is left until clock skew is actually seen.
- **Preferences that describe the device stay on it** (graphics quality, touch or desktop layout); the others keep travelling in the save.

## Why

- A mirror can only be as good as its last acknowledged write; a shared truth with a lease removes the cases where two devices write at once, which are the only real conflicts.
- A lease that expires by itself beats a lock that a crashed device would hold forever; a forced Takeover that keeps the loser's work as a previous version beats any merge of two city states.
- Merging two City states cannot be made safe, so the player's own choice stays for the rare real divergence.

## Consequences

- Losing a City stays the worst failure: nothing is overwritten without a previous version on one side.
- A new table or column for the lease and a migration validated with pgTAP in CI; the lease RPC is prefixed `urb_` like the rest.
- A clock set far ahead on one device no longer stalls another: `lastSeen` is capped when a save is adopted.
- Email attached becomes the way to play on another device; an anonymous account still works on one.
