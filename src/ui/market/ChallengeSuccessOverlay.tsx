import { useEffect } from 'react';
import { useChallenges } from '../common/hooks';
import { ChallengeSuccess } from './ChallengeSuccess';

export function ChallengeSuccessOverlay() {
  const success = useChallenges((store) => store.success);
  const setSuccess = useChallenges((store) => store.setSuccess);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 7000);
    return () => window.clearTimeout(timer);
  }, [success, setSuccess]);

  if (!success) return null;
  return <ChallengeSuccess key={success.id} success={success} onDismiss={() => setSuccess(null)} />;
}
