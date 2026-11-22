import type { AchievementCategoryId, AchievementDef } from './achievementTypes';
import { ARCHITECT } from './categories/architect';
import { ENERGY } from './categories/energy';
import { HOUSING } from './categories/housing';
import { ENVIRONMENT } from './categories/environment';
import { INTERIORS } from './categories/interiors';
import { LEISURE } from './categories/leisure';
import { MANAGEMENT } from './categories/management';
import { SOCIAL } from './categories/social';
import { POLITICS } from './categories/politics';
import { PRODUCTION } from './categories/production';
import { TRANSPORT } from './categories/transport';

export const ACHIEVEMENTS: readonly AchievementDef[] = [...PRODUCTION, ...HOUSING, ...TRANSPORT, ...INTERIORS, ...ENERGY, ...POLITICS, ...ARCHITECT, ...LEISURE, ...ENVIRONMENT, ...SOCIAL, ...MANAGEMENT];

export const CATEGORY_NAMES: Record<AchievementCategoryId, { readonly en: string; readonly fr: string }> = {
  production: { en: 'Production and economy', fr: 'Production et économie' },
  housing: { en: 'Housing and growth', fr: 'Habitat et croissance' },
  transport: { en: 'Transport', fr: 'Transports' },
  interiors: { en: 'Interiors', fr: 'Intérieurs' },
  energy: { en: 'Energy and water', fr: 'Énergie et eau' },
  politics: { en: 'Politics', fr: 'Politique' },
  architect: { en: 'Architect', fr: 'Architect' },
  leisure: { en: 'Leisure and tourism', fr: 'Loisirs et tourisme' },
  environment: { en: 'Environment', fr: 'Environnement' },
  social: { en: 'Social', fr: 'Social' },
  management: { en: 'City management', fr: 'Gestion de la ville' },
};

export function achievementsOf(category: AchievementCategoryId): readonly AchievementDef[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.category === category);
}

// The name a category's Medal carries in each language, kept by the server for every client to show.
export function medalNamesOf(category: AchievementCategoryId): { readonly fr: string; readonly en: string } {
  return { fr: `Succès : ${CATEGORY_NAMES[category].fr}`, en: `Achievements: ${CATEGORY_NAMES[category].en}` };
}
