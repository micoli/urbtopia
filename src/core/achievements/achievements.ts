import type { AchievementCategoryId, AchievementDef } from './achievementTypes';
import { ACHIEVEMENT_CATEGORIES } from './achievementTypes';

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'transport.firstRoad', category: 'transport', trigger: { type: 'created', collection: 'roads' },
    name: { en: 'First road', fr: 'Première route' }, description: { en: 'Build a Road.', fr: 'Construisez une route.' } },
  { id: 'transport.busLine', category: 'transport', trigger: { type: 'created', collection: 'busLines' },
    name: { en: 'Bus line', fr: 'Ligne de bus' }, description: { en: 'Create a Bus line.', fr: 'Créez une ligne de bus.' } },
  { id: 'transport.brtCorridor', category: 'transport', trigger: { type: 'created', collection: 'brtRoads' },
    name: { en: 'BRT corridor', fr: 'Couloir BRT' }, description: { en: 'Build a BRT corridor.', fr: 'Construisez un couloir BRT.' } },
  { id: 'transport.railwayLine', category: 'transport', trigger: { type: 'created', collection: 'transitLines', mode: 'rail' },
    name: { en: 'All aboard the Train', fr: 'En voiture, le Train' }, description: { en: 'Create a Railway line.', fr: 'Créez une ligne de Railway.' } },
  { id: 'transport.metroLine', category: 'transport', trigger: { type: 'created', collection: 'transitLines', mode: 'metro' },
    name: { en: 'Under the city', fr: 'Sous la ville' }, description: { en: 'Create a Metro line.', fr: 'Créez une ligne de Metro.' } },
  { id: 'transport.bridge', category: 'transport', trigger: { type: 'created', collection: 'bridges' },
    name: { en: 'Bridge builder', fr: 'Bâtisseur de ponts' }, description: { en: 'Build a Bridge.', fr: 'Construisez un Bridge.' } },
  { id: 'transport.pedestrianWay', category: 'transport', trigger: { type: 'created', collection: 'pedestrianWays' },
    name: { en: 'On foot', fr: 'À pied' }, description: { en: 'Build a Pedestrian way.', fr: 'Construisez une Pedestrian way.' } },
];

export const CATEGORY_NAMES: Record<AchievementCategoryId, { readonly en: string; readonly fr: string }> = {
  transport: { en: 'Transport', fr: 'Transports' },
};

export { ACHIEVEMENT_CATEGORIES };

export function achievementsOf(category: AchievementCategoryId): readonly AchievementDef[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.category === category);
}

// The name a category's Medal carries in each language, kept by the server for every client to show.
export function medalNamesOf(category: AchievementCategoryId): { readonly fr: string; readonly en: string } {
  return { fr: `Succès : ${CATEGORY_NAMES[category].fr}`, en: `Achievements: ${CATEGORY_NAMES[category].en}` };
}
