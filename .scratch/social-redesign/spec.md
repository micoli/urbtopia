# Social redesign: one sign-in, four tabs, Groups, local-auth

Status: ready-for-agent

## Problem

The online part (Cloud save, Friends, Messages, Trade offers) is hard to find and to use: sign-in exists in two places (Settings and the Friends tab), and the Friends tab stacks everything flat (search, requests, Friends, blocked, Handle, Avatar, findable). Players also want discussion rooms of several people. Debugging the online flows needs an email code every time.

## Decisions

Vocabulary (Group, Group message, Handle) in `CONTEXT.md`; Group model in [ADR 0030](../../docs/adr/0030-groups-have-no-invitation-link.md).

- **One sign-in, in Settings.** The email code form lives only in Settings, Cloud save section. A signed-out player opening Social sees a call to action with the benefit ("Save your city online and play with friends"); its button closes Social and opens Settings on the Account section. Once signed in, Social reopens by itself. The Handle step stays in Social.
- **Four tabs** in the Social window, each with its badge: Friends (list, incoming/outgoing requests, "Add a friend"), Groups, Exchanges (unchanged), Profile (Handle with its 30-day delay, Avatar, findable, blocked list, read-only Account block with email and Cloud save status and a "Manage in Settings" link).
- **Entry points.** Settings Cloud save section shows a status line with an "Open Social" button when signed in. The HUD Social button badge sums Friends, Groups and Exchanges.
- **Groups.** Name 3 to 30 characters with the Handle forbidden-words filter; 10 members including the creator; 5 Groups created and 10 joined per player. Only the creator adds members (own Friends), renames, removes a member, or deletes the Group; the creator cannot leave without deleting. A member can leave. A member who stops being a Friend of the creator is removed. Group messages: 500 characters, 30 days, daily cap shared with Messages, polling per ADR 0026 (15 s while the Groups tab is open, 60 s for the badge). Unread count per member through a read cursor per Group. A member can Block another member; the blocker no longer sees their Group messages.
- **Groups UI.** List sorted by last message (name, member count, last message preview, unread dot), "New group" form (name, tick Friends, at least one), empty state. Group view: header (back, name, member count, "..." menu), message list and composer reusing `MessageList` and `MessageComposer`; menu: Members, Leave; creator also Rename, Add friends, Remove a member, Delete (inline confirm). Member list has a Block action.
- **`?local-auth=<email>`.** Active only when `import.meta.env.DEV` and the Supabase URL is local (`127.0.0.1` or `localhost`); ignored otherwise and excluded from the production build. No email code: deterministic password derived from the email, `signUp` then `signInWithPassword`, replacing the current session. Handle = slug of the whole email (`@` and `.` become `-`), cut to 20 characters with a 4-character hash suffix when longer, numeric suffix on collision. Documented in `CLAUDE.md` next to `keep-local`.
- Server writes through `urb_`-prefixed RPC with RLS (ADR 0015); one React component per file; FR/EN strings.

## Out of scope

Invitation links, roles beyond creator and member, ownership transfer, Trade offers inside a Group, "Add as friend" from a Group member, Realtime.
