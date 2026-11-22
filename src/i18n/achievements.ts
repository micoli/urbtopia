import { ACHIEVEMENTS, CATEGORY_NAMES } from '../core/achievements/achievements';
import type { AchievementCategoryId } from '../core/achievements/achievementTypes';

const texts = {
  'achievements.title': ['Achievements', 'Succès'],
  'achievements.progress': ['{acquired} of {total}', '{acquired} sur {total}'],
  'achievements.complete': ['Complete', 'Terminé'],
  'achievements.needsCitizens': ['From {citizens} Citizens', 'À partir de {citizens} Citizens'],
  'achievements.needsDifficulty': ['Not on this Difficulty', 'Absent de cette difficulté'],
  'achievements.done': ['Done', 'Fait'],
  'achievements.todo': ['To do', 'À faire'],
  'achievements.empty': ['No Achievement on this Difficulty.', 'Aucun succès à cette difficulté.'],
  'achievements.unlocked': ['Achievement: {name}', 'Succès : {name}'],
  'achievements.unlockedMany': ['{count} Achievements unlocked', '{count} succès débloqués'],
  'achievements.seeded': ['{count} Achievements recognised in your City', '{count} succès reconnus dans votre City'],
  'achievements.medal': ['Medal earned: {name}', 'Médaille obtenue : {name}'],
} as const satisfies Record<string, readonly [string, string]>;

type TextKey = keyof typeof texts;
type AchievementKey = `achievement.${string}.${'name' | 'description'}`;
type CategoryKey = `achievementCategory.${AchievementCategoryId}`;

export type AchievementMessageKey = TextKey | AchievementKey | CategoryKey;

export function achievementMessages(language: 'en' | 'fr'): Record<AchievementMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const fixed = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  const achievements = ACHIEVEMENTS.flatMap((entry) => [[`achievement.${entry.id}.name`, entry.name[language]], [`achievement.${entry.id}.description`, entry.description[language]]]);
  const categories = Object.entries(CATEGORY_NAMES).map(([id, name]) => [`achievementCategory.${id}`, name[language]]);
  return Object.fromEntries([...fixed, ...achievements, ...categories]) as Record<AchievementMessageKey, string>;
}
