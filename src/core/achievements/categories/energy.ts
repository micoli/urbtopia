import type { AchievementDef } from '../achievementTypes';

export const ENERGY: readonly AchievementDef[] = [
  { id: 'energy.powerPlant', category: 'energy', trigger: { type: 'created', counter: 'building:powerPlant,coalPlant' },
    name: { en: 'Power on', fr: 'Courant rétabli' }, description: { en: 'Place a Power plant.', fr: 'Posez une Power plant.' } },
  { id: 'energy.engineRoom', category: 'energy', trigger: { type: 'created', counter: 'engineRoomFixtures' },
    name: { en: 'Engine room at work', fr: 'Salle des machines en marche' }, description: { en: 'Place a Fixture in the Engine room of a Power plant.', fr: 'Posez un Fixture dans l’Engine room d’une Power plant.' } },
  { id: 'energy.cleanPower', category: 'energy', trigger: { type: 'created', counter: 'building:hydroPlant,geothermalPlant,largeGeothermalPlant' },
    name: { en: 'Clean power', fr: 'Énergie propre' }, description: { en: 'Place a Hydro or Geothermal power plant.', fr: 'Posez une Hydro ou Geothermal power plant.' } },
  { id: 'energy.solar', category: 'energy', trigger: { type: 'command', commands: ['EquipSolarPanels'] },
    name: { en: 'Sun on the roof', fr: 'Du soleil sur le toit' }, description: { en: 'Equip a Home with Solar panels.', fr: 'Équipez un Home de Solar panels.' } },
  { id: 'energy.waterTower', category: 'energy', trigger: { type: 'created', counter: 'building:waterTower' },
    name: { en: 'Water tower', fr: 'Château d’eau' }, description: { en: 'Place a Water tower.', fr: 'Posez une Water tower.' } },
];
