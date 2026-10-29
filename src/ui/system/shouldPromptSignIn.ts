import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import type { CloudAccount } from '../../persistence/cloud/types';

export const SIGN_IN_PROMPT_CITIZENS = 200;
export const SIGN_IN_PROMPT_SNOOZE_MS = 12 * 3_600_000;

interface SignInPromptInput {
  citizens: number;
  cloudEnabled: boolean;
  account: CloudAccount | null;
  status: CloudStatus;
  cloudPaused: boolean;
  enabled: boolean;
  dismissed: boolean;
  dismissedAt: number | null;
  now: number;
}

export function shouldPromptSignIn({ citizens, cloudEnabled, account, status, cloudPaused, enabled, dismissed, dismissedAt, now }: SignInPromptInput): boolean {
  if (!enabled || dismissed || !cloudEnabled || citizens < SIGN_IN_PROMPT_CITIZENS) return false;
  if (dismissedAt !== null && now - dismissedAt < SIGN_IN_PROMPT_SNOOZE_MS) return false;
  if (account?.email) return false;
  if (status.kind === 'conflict') return false;
  if (status.kind === 'idle' && !cloudPaused) return false;
  return true;
}
