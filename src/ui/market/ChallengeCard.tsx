import { challengeReward } from '../../core';
import { challengeName } from '../../i18n/challengeName';
import { t } from '../../i18n/t';
import type { Challenge } from '../../challenges/types';
import { ActionButton } from '../common/ActionButton';
import { CurrencyText } from '../common/CurrencyText';
import { ChallengeGoalLine } from './ChallengeGoalLine';

interface ChallengeCardProps {
  challenge: Challenge;
  blocked: boolean;
  busy: boolean;
  onAccept: () => void;
}

export function ChallengeCard({ challenge, blocked, busy, onAccept }: ChallengeCardProps) {
  const reward = challenge.rewardKind === 'urbs' ? t('challenge.rewardUrbs').replace('{amount}', String(challengeReward(challenge.goal))) : t('challenge.rewardMedal');
  return (
    <li className="challenge-card">
      <header>
        <strong>{challengeName(challenge)}</strong>
        <small>{challenge.kind === 'daily' && challenge.difficulty ? `${t('challenge.kind.daily')} · ${t(`difficulty.${challenge.difficulty}`)}` : t('challenge.kind.event')}</small>
      </header>
      <ul className="challenge-lines">
        {challenge.goal.map((line) => (
          <ChallengeGoalLine key={line.item} item={line.item} quantity={line.quantity} />
        ))}
      </ul>
      <p className="challenge-reward">
        <CurrencyText text={reward} />
      </p>
      {blocked ? <p className="challenge-note">{t('challenge.busy')}</p> : null}
      <ActionButton variant="primary" disabled={blocked || busy} onClick={onAccept}>
        {t('challenge.accept')}
      </ActionButton>
    </li>
  );
}
