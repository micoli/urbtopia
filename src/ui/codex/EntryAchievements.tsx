import { achievementsAbout } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

interface EntryAchievementsProps {
  id: string;
}

// The Achievements a building is the subject of, so the Codex page points back to the list.
export function EntryAchievements({ id }: EntryAchievementsProps) {
  const achievements = achievementsAbout(id);
  if (achievements.length === 0) return null;
  return (
    <p className="codex-achievements">
      <strong>{t('achievements.title')}</strong>
      {achievements.map((achievement) => <span key={achievement.id}>{t(`achievement.${achievement.id}.name` as MessageKey)}</span>)}
    </p>
  );
}
