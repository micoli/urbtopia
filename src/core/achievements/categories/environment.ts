import type { AchievementDef } from '../achievementTypes';

export const ENVIRONMENT: readonly AchievementDef[] = [
  { id: 'environment.waste', category: 'environment', trigger: { type: 'created', counter: 'category:waste' },
    name: { en: 'Waste collected', fr: 'Déchets collectés' }, description: { en: 'Place a Waste facility.', fr: 'Posez une Waste facility.' } },
  { id: 'environment.recycling', category: 'environment', trigger: { type: 'created', counter: 'building:recyclingPlant' },
    name: { en: 'Recycling', fr: 'Recyclage' }, description: { en: 'Place a Recycling plant.', fr: 'Posez une Recycling plant.' } },
  { id: 'environment.greenSpace', category: 'environment', trigger: { type: 'created', counter: 'kind:green' },
    name: { en: 'Green space', fr: 'Espace vert' }, description: { en: 'Place a Green space.', fr: 'Posez un Green space.' } },
  { id: 'environment.landValue', category: 'environment', trigger: { type: 'signal', signal: 'landValueOpened' },
    name: { en: 'Land value', fr: 'Valeur du terrain' }, description: { en: 'Open the Land value Layer of the Analytics view.', fr: 'Ouvrez la Layer Land value de l’Analytics view.' } },
];
