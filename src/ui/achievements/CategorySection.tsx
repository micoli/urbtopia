import { achievementsOf, type CategoryProgress, type GameState } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';
import { AchievementRow } from './AchievementRow';

interface CategorySectionProps {
  state: GameState;
  progress: CategoryProgress;
}

export function CategorySection({ state, progress }: CategorySectionProps) {
  const name = t(`achievementCategory.${progress.category}` as MessageKey);
  const headingId = `achievements-${progress.category}`;
  return (
    <section className="eco-section" aria-labelledby={headingId} id={headingId + '-section'}>
      <h3 id={headingId}>
        {progress.complete ? <Icon name="medal" /> : null} {name}
      </h3>
      <p className="achievement-progress">
        {progress.complete ? t('achievements.complete') : t('achievements.progress').replace('{acquired}', String(progress.acquired)).replace('{total}', String(progress.total))}
      </p>
      <ProgressBar value={progress.acquired} max={progress.total} label={name} />
      <ul className="achievement-list">
        {achievementsOf(progress.category).map((achievement) => <AchievementRow key={achievement.id} state={state} achievement={achievement} />)}
      </ul>
    </section>
  );
}
