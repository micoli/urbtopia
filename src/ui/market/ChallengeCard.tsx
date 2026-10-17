import { challengeReward } from '../../core';
import { challengeName } from '../../i18n/challengeName';
import { t } from '../../i18n/t';
import type { Challenge } from '../../challenges/types';
import { ActionButton } from '../common/ActionButton';
import { CurrencyText } from '../common/CurrencyText';
import { useGame } from '../common/hooks';
import { ChallengeGoalLine } from './ChallengeGoalLine';
import { storedOf } from './storedOf';

interface ChallengeCardProps {
  challenge: Challenge;
  blocked: boolean;
  locked?: boolean;
  busy: boolean;
  onAccept: () => void;
}

export function ChallengeCard({ challenge, blocked, locked = false, busy, onAccept }: ChallengeCardProps) {
  const storage = useGame((store) => store.state.storage);
  const reward = challenge.rewardKind === 'urbs' ? t('challenge.rewardUrbs').replace('{amount}', String(challengeReward(challenge.goal))) : t('challenge.rewardMedal');
  return (
    <li className={`challenge-card${blocked || locked ? ' challenge-card-unavailable' : ''}`}>
      <header>
        <strong>{challengeName(challenge)}</strong>
        <small>{challenge.kind === 'daily' && challenge.difficulty ? `${t('challenge.kind.daily')} · ${t(`difficulty.${challenge.difficulty}`)}` : t('challenge.kind.event')}</small>
      </header>
      <ul className="challenge-lines">
        {challenge.goal.map((line) => (
          <ChallengeGoalLine key={line.item} item={line.item} quantity={line.quantity} available={storedOf(storage, line.item)} />
        ))}
      </ul>
      <p className="challenge-reward">
        <CurrencyText text={reward} />
      </p>
      {locked ? <p className="challenge-note">{t('challenge.locked').replace('{count}', String(challenge.minCitizens))}</p> : blocked ? <p className="challenge-note">{t('challenge.busy')}</p> : null}
      <ActionButton variant="primary" disabled={locked || blocked || busy} onClick={onAccept}>
        {t(locked || blocked ? 'challenge.notAvailable' : 'challenge.accept')}
      </ActionButton>
    </li>
  );
}
