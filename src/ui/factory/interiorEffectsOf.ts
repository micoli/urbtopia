import { interiorBonusOfBuilding, recyclingGainsOf, type Building, type BuildingType } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import type { IconName } from '../common/iconRegistry';
import { formatPercent } from './formatPercent';

export interface InteriorEffect {
  id: string;
  icon: IconName;
  label: MessageKey;
  value: string;
}

type EffectId = 'speed' | 'yield' | 'sales' | 'capacity' | 'fieldCap' | 'wasteCapacity' | 'reach' | 'generation' | 'cleaner';

const DEFAULT_EFFECTS: readonly EffectId[] = ['speed', 'yield'];

// The levers of each Production interior; the others raise speed and yield.
const EFFECTS_BY_TYPE: Partial<Record<BuildingType, readonly EffectId[]>> = {
  mill: ['speed'],
  textileMill: ['speed'],
  knitwearFactory: ['speed', 'yield', 'sales'],
  livestockFarm: ['yield'],
  farm: ['yield', 'fieldCap'],
  bakery: ['speed', 'yield', 'sales'],
  dairy: ['yield'],
  storehouse: ['capacity'],
  vault: ['capacity'],
  materialDepot: ['capacity'],
  recyclingPlant: ['wasteCapacity', 'reach'],
  coalPlant: ['generation', 'cleaner'],
  geothermalPlant: ['generation'],
  hydroPlant: ['generation'],
  largeGeothermalPlant: ['generation'],
};

const PRESENTATION: Record<EffectId, { icon: IconName; label: MessageKey }> = {
  speed: { icon: 'trend', label: 'factory.interior.speed' },
  yield: { icon: 'yield', label: 'factory.interior.yield' },
  sales: { icon: 'money', label: 'factory.interior.sales' },
  capacity: { icon: 'disk', label: 'factory.interior.capacity' },
  fieldCap: { icon: 'map', label: 'factory.interior.fieldCap' },
  wasteCapacity: { icon: 'trash', label: 'factory.interior.wasteCapacity' },
  reach: { icon: 'map', label: 'factory.interior.reach' },
  generation: { icon: 'power', label: 'factory.interior.generation' },
  cleaner: { icon: 'cloud', label: 'factory.interior.cleaner' },
};

// What a Production interior delivers now, limited to the levers its building has.
export function interiorEffectsOf(building: Pick<Building, 'type' | 'tier' | 'interior' | 'breakerOff'>): InteriorEffect[] {
  const bonus = interiorBonusOfBuilding(building);
  const recycling = recyclingGainsOf(building);
  const values: Record<EffectId, string> = {
    speed: formatPercent(bonus.speed),
    yield: formatPercent(bonus.yield),
    sales: formatPercent(bonus.sales ?? 0),
    capacity: formatPercent(bonus.capacity ?? 0),
    fieldCap: formatPercent(bonus.capacity ?? 0),
    wasteCapacity: `+${Math.round(recycling.capacity)}`,
    reach: `+${recycling.collectionDistance}`,
    generation: formatPercent(bonus.generation ?? 0),
    cleaner: `−${formatPercent(bonus.cleaner ?? 0).replace('+', '')}`,
  };
  return (EFFECTS_BY_TYPE[building.type] ?? DEFAULT_EFFECTS).map(id => ({ id, ...PRESENTATION[id], value: values[id] }));
}
