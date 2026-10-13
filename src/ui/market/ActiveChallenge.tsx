import { challengeReward, setAsideOf, type GameState } from '../../core';
import { challengeName } from '../../i18n/challengeName';
import { t } from '../../i18n/t';
import type { AcceptedChallenge, Challenge } from '../../challenges/types';
import { CurrencyText } from '../common/CurrencyText';
import { formatDuration } from '../common/formatDuration';
import { useNow } from '../common/useNow';
import { ChallengeGoalLine } from './ChallengeGoalLine';

interface ActiveChallengeProps {
  challenge: Challenge;
  accepted: AcceptedChallenge;
  state: GameState;
  clockOffset: number;
  onSetAside: (item: string, quantity: number) => void;
}

export function ActiveChallenge({ challenge, accepted, state, clockOffset, onSetAside }: ActiveChallengeProps) {
  const now = useNow(1000);
  const progress = state.challenge?.id === challenge.id ? state.challenge : undefined;
  const reward = challenge.rewardKind === 'urbs' ? t('challenge.rewardUrbs').replace('{amount}', String(challengeReward(challenge.goal))) : t('challenge.rewardMedal');
  const stored = (item: string) => (state.storage.materials as Record<string, number | undefined>)[item] ?? (state.storage.goods as Record<string, number | undefined>)[item] ?? 0;
  return (
    <section className="challenge-card challenge-active" aria-label={t('challenge.current')}>
      <header>
        <strong>{challengeName(challenge)}</strong>
        <small>{t('challenge.current')}</small>
      </header>
      <p className="challenge-time">{t('challenge.timeLeft').replace('{time}', formatDuration(accepted.deadline - (now + clockOffset)))}</p>
      <ul className="challenge-lines">
        {challenge.goal.map((line) => (
          <ChallengeGoalLine key={line.item} item={line.item} quantity={line.quantity} setAside={progress ? setAsideOf(progress, line.item) : 0} available={stored(line.item)} onSetAside={(quantity) => onSetAside(line.item, quantity)} />
        ))}
      </ul>
      <p className="challenge-reward">
        <CurrencyText text={reward} />
      </p>
      <p className="challenge-note">{t('challenge.noTimeSkip')}</p>
    </section>
  );
}
