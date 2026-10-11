# Multiplayer, delivery 2: messaging between Friends

Status: done

## Problem

Friends (delivery 1, `../multiplayer-friends/spec.md`) cannot talk to each other. Delivery 3 (Trade offers) will live inside these conversations.

## Decisions

Settled in the grilling that produced ADRs 0025 and 0026; polling per [ADR 0026](../../docs/adr/0026-social-features-poll-instead-of-realtime.md). Vocabulary in `CONTEXT.md` (Friend, Block, Message, Conversation).

- A Conversation is one-to-one and exists only between two Friends. Messages are plain text, 1 to 500 characters after trimming.
- Sending is refused unless the two accounts are Friends; at most 30 messages per minute per sender (error with the remaining delay).
- History is kept 30 days, then purged by a `pg_cron` job. Removing a Friend, or a Block, deletes the Conversation at once. Deleting cloud data deletes the player's Messages.
- Each Friend carries an unread count and the time of the last Message in the social state, so the existing 15 s / 60 s poll (and its cursor) also delivers the unread badge. The cursor revision changes on every send and every read.
- Opening a Conversation loads its latest Messages and marks the other side's Messages as read; while it stays open, the same 15 s poll fetches only Messages newer than the last one received.
- All writes go through `urb_`-prefixed RPC with RLS and no direct client writes (ADR 0015).
- The navigation badge counts pending Friend requests plus unread Messages.
- UI strings translated FR/EN, one React component per file.

## Out of scope

Trade offers and attachments, Realtime/WebSocket, message editing or deletion by the sender, read receipts shown to the sender, group conversations, emoji pickers, notifications outside the game.

## Issues

1. `01-messages-schema-and-rpc` - table, RPC, unread in the social state, purge, pgTAP
2. `02-messages-client` - `SocialClient` methods, fake client, parsing
3. `03-conversation-ui` - Friend row button, conversation view, composer, errors
4. `04-unread-badge-and-polling` - unread counts in the badge, open-conversation polling
