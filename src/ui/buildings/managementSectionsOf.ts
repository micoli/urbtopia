import { FACILITIES, isFacilityType, kindOf, wasteKindOf, type Building } from '../../core';
import type { ManagementSectionId } from '../stats/management/managementSections';

const UTILITY_SECTIONS: Record<string, readonly ManagementSectionId[]> = {
  waterTower: ['eco-water'],
  coalPlant: ['eco-energy', 'eco-emissions'],
};

const STOP_SECTIONS: Record<string, readonly ManagementSectionId[]> = {
  railStation: ['eco-railMetro'],
  metroStation: ['eco-railMetro'],
  transitHub: ['eco-transport', 'eco-railMetro'],
};

function facilitySections(type: string): readonly ManagementSectionId[] {
  if (!isFacilityType(type)) return [];
  if (FACILITIES[type].category !== 'waste') return ['eco-services'];
  return type === 'incinerator' ? ['eco-waste', 'eco-emissions'] : ['eco-waste'];
}

// The sections of City management that tell more about a building.
export function managementSectionsOf({ type }: Pick<Building, 'type'>): readonly ManagementSectionId[] {
  if (wasteKindOf(type)) return facilitySections(type);
  switch (kindOf(type)) {
    case 'home': return ['eco-needs', 'eco-services', 'eco-jobs'];
    case 'production':
    case 'farm':
    case 'storage': return ['eco-production'];
    case 'utility': return UTILITY_SECTIONS[type] ?? ['eco-energy'];
    case 'solar':
    case 'battery': return ['eco-energy'];
    case 'backup': return ['eco-energy', 'eco-emissions'];
    case 'green':
    case 'nature': return ['eco-nature'];
    case 'facility': return facilitySections(type);
    case 'casino':
    case 'venue': return ['eco-tourism'];
    case 'transitStop': return STOP_SECTIONS[type] ?? ['eco-transport'];
    default: return [];
  }
}
