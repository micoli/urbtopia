import type { AchievementDef } from '../achievementTypes';

export const ARCHITECT: readonly AchievementDef[] = [
  { id: 'architect.office', category: 'architect', trigger: { type: 'created', counter: 'building:architectOffice' },
    name: { en: 'Architect office', fr: 'Architect office' }, description: { en: 'Place an Architect office.', fr: 'Posez un Architect office.' } },
  { id: 'architect.planningOffice', category: 'architect', trigger: { type: 'created', counter: 'building:planningOffice' },
    name: { en: 'Planning office', fr: 'Bureau de planification' }, description: { en: 'Place a Planning office.', fr: 'Posez un Planning office.' } },
  { id: 'architect.housePlan', category: 'architect', trigger: { type: 'created', counter: 'housePlans' },
    name: { en: 'House plan', fr: 'Plan de maison' }, description: { en: 'Save a House plan.', fr: 'Enregistrez un House plan.' } },
  { id: 'architect.districtPlan', category: 'architect', trigger: { type: 'command', commands: ['PlaceDistrictHex'] },
    name: { en: 'District plan', fr: 'Plan de quartier' }, description: { en: 'Place a Hex of a District plan.', fr: 'Posez un Hex d’un District plan.' } },
  { id: 'architect.designedHome', category: 'architect', trigger: { type: 'created', counter: 'designedHomes' },
    name: { en: 'A home of the city', fr: 'Un home de la cité' }, description: { en: 'Turn a House plan into a Home of the City.', fr: 'Faites d’un House plan un Home de la City.' } },
];
