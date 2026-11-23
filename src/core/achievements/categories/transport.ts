import type { AchievementDef } from '../achievementTypes';

export const TRANSPORT: readonly AchievementDef[] = [
  { id: 'transport.firstRoad', category: 'transport', trigger: { type: 'created', counter: 'roads' },
    name: { en: 'First road', fr: 'Première route' }, description: { en: 'Build a Road.', fr: 'Construisez une route.' } },
  { id: 'transport.busLine', category: 'transport', trigger: { type: 'created', counter: 'busLines' },
    name: { en: 'Bus line', fr: 'Ligne de bus' }, description: { en: 'Create a Bus line.', fr: 'Créez une ligne de bus.' } },
  { id: 'transport.brtCorridor', category: 'transport', trigger: { type: 'created', counter: 'brtRoads' },
    name: { en: 'BRT corridor', fr: 'Couloir BRT' }, description: { en: 'Build a BRT corridor.', fr: 'Construisez un couloir BRT.' } },
  { id: 'transport.railwayLine', category: 'transport', trigger: { type: 'created', counter: 'railLines' },
    name: { en: 'All aboard the Train', fr: 'En voiture, le Train' }, description: { en: 'Create a Railway line.', fr: 'Créez une ligne de Railway.' } },
  { id: 'transport.metroLine', category: 'transport', trigger: { type: 'created', counter: 'metroLines' },
    name: { en: 'Under the city', fr: 'Sous la ville' }, description: { en: 'Create a Metro line.', fr: 'Créez une ligne de Metro.' } },
  { id: 'transport.bridge', category: 'transport', trigger: { type: 'created', counter: 'bridges' },
    name: { en: 'Bridge builder', fr: 'Bâtisseur de ponts' }, description: { en: 'Build a Bridge.', fr: 'Construisez un Bridge.' } },
  { id: 'transport.pedestrianWay', category: 'transport', trigger: { type: 'created', counter: 'pedestrianWays' },
    name: { en: 'On foot', fr: 'À pied' }, description: { en: 'Build a Pedestrian way.', fr: 'Construisez une Pedestrian way.' } },
];
