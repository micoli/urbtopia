import type { AchievementDef } from '../achievementTypes';

export const HOUSING: readonly AchievementDef[] = [
  { id: 'housing.firstHome', category: 'housing', trigger: { type: 'created', counter: 'kind:home' },
    name: { en: 'First Home', fr: 'Premier Home' }, description: { en: 'Place a Home.', fr: 'Posez un Home.' } },
  { id: 'housing.upgrade', category: 'housing', trigger: { type: 'sim', event: 'BuildingUpgraded' },
    name: { en: 'Building upgraded', fr: 'Bâtiment amélioré' }, description: { en: 'Upgrade a building to the next Tier.', fr: 'Améliorez un bâtiment au Tier suivant.' } },
  { id: 'housing.school', category: 'housing', trigger: { type: 'created', counter: 'building:school,middleSchool,highSchool,university' },
    name: { en: 'A school for the Citizens', fr: 'Une école pour les Citizens' }, description: { en: 'Place a School.', fr: 'Posez une School.' } },
  { id: 'housing.library', category: 'housing', trigger: { type: 'created', counter: 'building:library' },
    name: { en: 'Culture at hand', fr: 'La culture à portée' }, description: { en: 'Place a Library.', fr: 'Posez une Library.' } },
  { id: 'housing.thousandCitizens', category: 'housing', trigger: { type: 'threshold', counter: 'citizens', atLeast: 1000 },
    name: { en: 'A thousand Citizens', fr: 'Mille Citizens' }, description: { en: 'Reach 1000 Citizens.', fr: 'Atteignez 1000 Citizens.' } },
];
