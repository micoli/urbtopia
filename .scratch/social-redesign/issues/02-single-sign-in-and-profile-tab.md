# Single sign-in in Settings and Profile tab

Status: done - tsc, eslint, vitest and build pass
Blocked by: none
Spec: ../spec.md

## What to build

Remove the email code form from the Friends tab. A signed-out player opening Social sees the call to action; its button closes Social, opens Settings on the Account section, and Social reopens once signed in. Add the Profile tab (Handle step included, Avatar, findable, blocked list, read-only Account block with "Manage in Settings"). Settings Cloud save shows a status line with an "Open Social" button when signed in.

## Acceptance criteria

- [x] `FriendsPanel` no longer renders `EmailCodeForm`; `EmailCodeForm` is used in Settings only.
- [x] Signed-out CTA states the benefit in FR and EN; the button opens Settings scrolled and focused on Account; Social reopens automatically after sign-in.
- [x] Profile tab holds Handle form (30-day delay), Avatar picker, findable toggle, blocked list; the Handle step is shown here when the account has an email but no Handle.
- [x] Account block is read-only (email, Cloud save status) with a link to Settings.
- [x] `defaultSocialTab` updated; component tests with the fake clients; stories updated.
