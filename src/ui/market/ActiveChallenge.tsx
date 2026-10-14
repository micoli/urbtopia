import { challengeReward, setAsideOf, type GameState } from '../../core';
import { challengeName } from '../../i18n/challengeName';
import { t } from '../../i18n/t';
import type { AcceptedChallenge, Challenge } from '../../challenges/types';
import { useState } from 'react';
import { CurrencyText } from '../common/CurrencyText';
import { InlineConfirm } from '../common/InlineConfirm';
import { formatDuration } from '../common/formatDuration';
import { useNow } from '../common/useNow';
import { ChallengeGoalLine } from './ChallengeGoalLine';
import { storedOf } from './storedOf';

interface ActiveChallengeProps {
  challenge: Challenge;
  accepted: AcceptedChallenge;
  state: GameState;
  clockOffset: number;
  busy: boolean;
  onSetAside: (item: string, quantity: number) => void;
  onAbandon: () => void;
}

export function ActiveChallenge({ challenge, accepted, state, clockOffset, busy, onSetAside, onAbandon }: ActiveChallengeProps) {
  const now = useNow(1000);
  const [confirming, setConfirming] = useState(false);
  const progress = state.challenge?.id === challenge.id ? state.challenge : undefined;
  const reward = challenge.rewardKind === 'urbs' ? t('challenge.rewardUrbs').replace('{amount}', String(challengeReward(challenge.goal))) : t('challenge.rewardMedal');
  return (
    <section className="challenge-card challenge-active" aria-label={t('challenge.current')}>
      <header>
        <strong>{challengeName(challenge)}</strong>
        <small>{t('challenge.current')}</small>
      </header>
      <p className="challenge-time">{t('challenge.timeLeft').replace('{time}', formatDuration(accepted.deadline - (now + clockOffset)))}</p>
      <ul className="challenge-lines">
        {challenge.goal.map((line) => (
          <ChallengeGoalLine key={line.item} item={line.item} quantity={line.quantity} setAside={progress ? setAsideOf(progress, line.item) : 0} available={storedOf(state.storage, line.item)} onSetAside={(quantity) => onSetAside(line.item, quantity)} />
        ))}
      </ul>
      <p className="challenge-reward">
        <CurrencyText text={reward} />
      </p>
      <p className="challenge-note">{t('challenge.noTimeSkip')}</p>
      {busy ? null : <InlineConfirm confirming={confirming} triggerLabel={t('challenge.abandon')} confirmLabel={t('challenge.abandonConfirm')} message={t('challenge.abandonWarning')} onRequest={() => setConfirming(true)} onCancel={() => setConfirming(false)} onConfirm={onAbandon} />}
    </section>
  );
}
