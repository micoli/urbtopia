# Email magic link account

Status: done - verified against a local Supabase (confirmation mail, redirect, second device); production Auth settings are in docs/security.md
Blocked by: 05, 06, 07
Spec: ../spec.md

## What to build

Let a Player account get an email so the Cloud save follows the player across devices.

## Acceptance criteria

- [x] Anonymous account: enter an email, receive a link; the link upgrades the same user (data kept).
- [x] An email already in use signs in to that account instead; the sync layer forgets its revision and the Save conflict dialog arbitrates.
- [x] Signed-in state shows the email and a sign-out button; signing out continues with a fresh anonymous account.
- [x] Typed errors for invalid email, rate limiting and failure, FR and EN strings.
- [x] Local config requires email confirmation and allows the dev redirect URLs.
- [x] Bilingual (FR then EN) skinned templates for the email change and magic link mails in `supabase/templates/`, wired in the local `config.toml`; production needs them pasted in the dashboard.
