import { visibleChallenges } from '../../challenges/visibleChallenges';
import { t } from '../../i18n/t';
import { useChallenges, useGame, useUi } from '../common/hooks';
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
  const openSettings = useUi((store) => store.openSettingsFromSocial);

  if (!enabled) return <p>{t('challenge.unavailable')}</p>;
  if (status === 'sign-in-required') return <SignInPrompt onSignIn={() => openSettings(true)} />;
  if (!snapshot) return <p>{t('challenge.loading')}</p>;

  const accepted = snapshot.accepted;
  const running = accepted ? snapshot.challenges.find(({ id }) => id === accepted.challengeId) : undefined;
  const open = visibleChallenges(state, snapshot.challenges).filter(({ id }) => id !== accepted?.challengeId);

  return (
    <>
      {status === 'offline' ? <p className="challenge-note">{t('challenge.offline')}</p> : null}
      {failure ? <p className="challenge-note" role="alert">{t(`challenge.error.${failure}`)}</p> : null}
      {accepted && running ? <ActiveChallenge challenge={running} accepted={accepted} state={state} clockOffset={clockOffset} onSetAside={(item, quantity) => void actions?.setAside(item, quantity)} /> : null}
      {open.length === 0 && !running ? <p>{t('challenge.empty')}</p> : null}
      <ul className="challenge-list">
        {open.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} blocked={accepted !== null} busy={busy} onAccept={() => void actions?.accept(challenge.id)} />
        ))}
      </ul>
    </>
  );
}
