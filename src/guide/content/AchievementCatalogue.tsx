import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, featureTypesOf, type AchievementDef } from '../../core';
import { CODEX_ENTRIES, type CodexId } from '../../codex/catalog';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { EntryLink } from './EntryLink';

const isCodexId = (type: string): type is CodexId => CODEX_ENTRIES.some((entry) => entry.id === type);

function Needs({ achievement }: { achievement: AchievementDef }) {
  if (achievement.fromDifficulty) return <small>{t(`difficulty.${achievement.fromDifficulty}` as MessageKey)}+</small>;
  if (achievement.flag) return <small>{t('achievements.needsBeta')}</small>;
  return null;
}

// Every Achievement of every category, from the game's definitions and never from a player's City.
export function AchievementCatalogue() {
  return (
    <div className="guide-achievements">
      {ACHIEVEMENT_CATEGORIES.map((category) => (
        <section key={category}>
          <h2>{t(`achievementCategory.${category}` as MessageKey)}</h2>
          <ul>
            {ACHIEVEMENTS.filter((achievement) => achievement.category === category).map((achievement) => (
              <li key={achievement.id}>
                <strong>{t(`achievement.${achievement.id}.name` as MessageKey)}</strong>: {t(`achievement.${achievement.id}.description` as MessageKey)}{' '}
                {featureTypesOf(achievement).filter(isCodexId).map((type) => <EntryLink key={type} id={type} />)}
                <Needs achievement={achievement} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
