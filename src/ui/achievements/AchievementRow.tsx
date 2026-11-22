import { isAcquired, isAvailable, isPossible, type AchievementDef, type GameState } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { Icon } from '../common/Icon';

interface AchievementRowProps {
  state: GameState;
  flags: ReadonlySet<string>;
  achievement: AchievementDef;
}

function requirement(state: GameState, flags: ReadonlySet<string>, achievement: AchievementDef): string | null {
  if (!isPossible(state, achievement)) return t('achievements.needsDifficulty');
  if (!isAvailable(state, achievement, flags)) return t('achievements.needsBeta');
  if (achievement.unlockCitizens) return t('achievements.needsCitizens').replace('{citizens}', String(achievement.unlockCitizens));
  return null;
}

export function AchievementRow({ state, flags, achievement }: AchievementRowProps) {
  const done = isAcquired(state, achievement.id);
  const impossible = !isAvailable(state, achievement, flags);
  const needs = done ? null : requirement(state, flags, achievement);
  return (
    <li className="achievement-row" data-done={done} data-impossible={impossible}>
      <Icon name={done ? 'check' : 'trophy'} />
      <div className="achievement-row-text">
        <strong>{t(`achievement.${achievement.id}.name` as MessageKey)}</strong>
        <small>{t(`achievement.${achievement.id}.description` as MessageKey)}</small>
        {needs ? <small className="achievement-row-needs">{needs}</small> : null}
      </div>
      <span className="achievement-row-status">{done ? t('achievements.done') : t('achievements.todo')}</span>
    </li>
  );
}
