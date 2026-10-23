import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import type { CloudAccount } from '../../persistence/cloud/types';

export const SIGN_IN_PROMPT_CITIZENS = 200;

interface SignInPromptInput {
  citizens: number;
  cloudEnabled: boolean;
  account: CloudAccount | null;
  status: CloudStatus;
  cloudPaused: boolean;
  dismissed: boolean;
}

export function shouldPromptSignIn({ citizens, cloudEnabled, account, status, cloudPaused, dismissed }: SignInPromptInput): boolean {
  if (dismissed || !cloudEnabled || citizens < SIGN_IN_PROMPT_CITIZENS) return false;
  if (account?.email) return false;
  if (status.kind === 'conflict') return false;
  if (status.kind === 'idle' && !cloudPaused) return false;
  return true;
}
