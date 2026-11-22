import type { AchievementCategoryId, AchievementDef } from './achievementTypes';
import { ENERGY } from './categories/energy';
import { HOUSING } from './categories/housing';
import { INTERIORS } from './categories/interiors';
import { PRODUCTION } from './categories/production';
import { TRANSPORT } from './categories/transport';

export const ACHIEVEMENTS: readonly AchievementDef[] = [...PRODUCTION, ...HOUSING, ...TRANSPORT, ...INTERIORS, ...ENERGY];

export const CATEGORY_NAMES: Record<AchievementCategoryId, { readonly en: string; readonly fr: string }> = {
  production: { en: 'Production and economy', fr: 'Production et économie' },
  housing: { en: 'Housing and growth', fr: 'Habitat et croissance' },
  transport: { en: 'Transport', fr: 'Transports' },
  interiors: { en: 'Interiors', fr: 'Intérieurs' },
  energy: { en: 'Energy and water', fr: 'Énergie et eau' },
};

export function achievementsOf(category: AchievementCategoryId): readonly AchievementDef[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.category === category);
}

// The name a category's Medal carries in each language, kept by the server for every client to show.
export function medalNamesOf(category: AchievementCategoryId): { readonly fr: string; readonly en: string } {
  return { fr: `Succès : ${CATEGORY_NAMES[category].fr}`, en: `Achievements: ${CATEGORY_NAMES[category].en}` };
}
