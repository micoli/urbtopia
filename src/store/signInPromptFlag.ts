import { isE2eRequested } from './e2eFlag';

// The e2e mode keeps the sign-in prompt away; `sign-in-prompt` brings it back for a test of the prompt itself.
export function isSignInPromptAllowed(search: string): boolean {
  return new URLSearchParams(search).has('sign-in-prompt') || !isE2eRequested(search);
}
