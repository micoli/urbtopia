# A Group has no invitation link: only the creator's Friends can be members

Accepted. Builds on [ADR 0026](0026-social-features-poll-instead-of-realtime.md) (polling) and the Friends model of delivery 1.

A **Group** is a named room whose members are all Friends of its creator. Only the creator adds members, chosen among their own Friends; an added Friend is a member at once and can leave at any time. There is no invitation link, no join code and no invitation token.

## Why

- Friend search is by exact email and silent about outcomes, and a Block hides the blocker. A link anyone can open would let strangers reach a player without either protection.
- A link is a secret to generate, expire, revoke and rotate. Each of those is a state to store, a RPC to write and an abuse case to rate-limit. Friends-only needs none of it.
- The invariant "every member is a Friend of the creator" is computed from `urb_friendships`, which already carries the Block state.

## Consequences

- When a member stops being a Friend of the creator (removal or Block, in either direction), the server removes them from the Group. The Group never ends because of a member.
- Members are not Friends of each other. A Block between two members hides the blocked one's Group messages from the blocker, filtered when reading.
- Group messages share the 500-character limit, the 30-day purge and the daily sending cap of Messages, so a Group cannot bypass the cap.
- Sharing a Group outside the game (pasting a link in another messenger) is not possible. If it becomes a real need, a link can be added later as a join request the creator approves, without changing this model.
