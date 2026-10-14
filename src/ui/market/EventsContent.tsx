import { useEffect } from 'react';
import { visibleChallenges } from '../../challenges/visibleChallenges';
import { t } from '../../i18n/t';
import { useChallenges, useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { SignInPrompt } from '../social/SignInPrompt';
import { ActiveChallenge } from './ActiveChallenge';
import { ChallengeCard } from './ChallengeCard';

export function EventsContent() {
  const state = useGame((store) => store.state);
  const enabled = useChallenges((store) => store.enabled);
  const status = useChallenges((store) => store.status);
  const snapshot = useChallenges((store) => store.snapshot);
  const clockOffset = useChallenges((store) => store.clockOffset);
  const busy = useChallenges((store) => store.busy);
  const failure = useChallenges((store) => store.failure);
  const actions = useChallenges((store) => store.actions);
  const markSeen = useChallenges((store) => store.markSeen);
  const openSettings = useUi((store) => store.openSettingsFromSocial);
  const openCodex = useUi((store) => store.openCodex);
  const rules = <ActionButton onClick={() => openCodex(undefined, 'challenges')}>{t('codex.challenges.open')}</ActionButton>;
  const shown = snapshot ? visibleChallenges(state, snapshot.challenges) : [];
  const shownIds = shown.map(({ id }) => id).join(',');

  useEffect(() => {
    if (shownIds !== '') markSeen(shownIds.split(','));
  }, [shownIds, markSeen]);

  if (!enabled) return <><p>{t('challenge.unavailable')}</p>{rules}</>;
  if (status === 'sign-in-required') return <><SignInPrompt onSignIn={() => openSettings(true)} />{rules}</>;
  if (!snapshot) return <><p>{t('challenge.loading')}</p>{rules}</>;

  const accepted = snapshot.accepted;
  const running = accepted ? snapshot.challenges.find(({ id }) => id === accepted.challengeId) : undefined;
  const open = shown.filter(({ id }) => id !== accepted?.challengeId && !snapshot.abandoned.includes(id));

  return (
    <>
      {status === 'offline' ? <p className="challenge-note">{t('challenge.offline')}</p> : null}
      {failure ? <p className="challenge-note" role="alert">{t(`challenge.error.${failure}`)}</p> : null}
      {accepted && running ? <ActiveChallenge challenge={running} accepted={accepted} state={state} clockOffset={clockOffset} busy={busy} onSetAside={(item, quantity) => void actions?.setAside(item, quantity)} onAbandon={() => void actions?.abandon()} /> : null}
      {open.length === 0 && !running ? <p>{t('challenge.empty')}</p> : null}
      <ul className="challenge-list">
        {open.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} blocked={accepted !== null} busy={busy} onAccept={() => void actions?.accept(challenge.id)} />
        ))}
      </ul>
      {rules}
    </>
  );
}
