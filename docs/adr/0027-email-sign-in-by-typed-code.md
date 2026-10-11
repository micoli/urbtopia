# Email sign-in is confirmed by a one-time code typed in the game, not by a link

Accepted. Replaces the magic link of [ADR 0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md); the rest of that ADR stays valid.

To attach an email to a Player account, or to sign in to an existing one, the game asks Supabase Auth for a code (`updateUser({ email })` for an anonymous account, `signInWithOtp` when the email already has an account), the email shows a 6-digit code and no link, and the player copies the code into a field of the game, which confirms it with `verifyOtp` (`email_change` or `email`, remembered between the two steps). A wrong or expired code keeps the player on the code step, with a new code one click away; the code expires after 15 minutes.

The game runs in embedded browsers (in-app webviews) where opening a link in the email opens another browser or tab, with another session and a half-finished sign-in. The confirmation never leaves the game now.

## Why

- A link opened outside the webview cannot hand the session back to it; a code typed in place always can.
- Supabase's one-time code is the token the player would have to type anyway, so one 6-digit code is enough, no second secret.
- Supabase rate limits code verification, and a 15-minute expiry keeps a leaked email short-lived.

## Consequences

- The email templates show `{{ .Token }}` and must not contain `{{ .ConfirmationURL }}`; production needs the OTP length and expiry set (`scripts/push-email-templates.sh` does it) and the redirect URL is no longer needed.
- Typing six digits is more work than one tap on a phone; `autocomplete="one-time-code"` lets mobile keyboards offer the code from the email.
- The client recognises "email already used" and "wrong code" from the message as well as the error code, because the code is not always exposed to the browser.
