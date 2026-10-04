import { NATURE_MODELS } from '../core/environment/nature';
import { FACILITIES, FACILITY_TYPES, SERVICE_CATEGORIES, type BuildingType } from '../core';

const natureTypesOf = (decorative: boolean) => NATURE_MODELS.filter(([, , family]) => (family === 'decoration') === decorative).map(([type]) => type);
const PUBLIC_FACILITY_TYPES = SERVICE_CATEGORIES.flatMap(category => FACILITY_TYPES.filter(type => FACILITIES[type].category === category));

export const BUILDING_SECTIONS = [
  { title: 'build.housing', types: ['home'] },
  { title: 'build.production', types: ['workshop', 'factory', 'shop'] },
  { title: 'build.storage', types: ['storehouse', 'silo', 'vault'] },
  { title: 'build.utilities', types: ['powerPlant', 'coalPlant', 'waterTower', 'solar', 'battery', 'backup'] },
  { title: 'build.greenSpaces', types: ['tree', 'park', ...natureTypesOf(false)] },
  { title: 'build.transport', types: ['busStop', 'brtStation', 'railStation'] },
  { title: 'build.publicFacilities', types: PUBLIC_FACILITY_TYPES },
  { title: 'build.decoration', types: natureTypesOf(true) },
] as const satisfies readonly { title: string; types: readonly BuildingType[] }[];

export type BuildSection = typeof BUILDING_SECTIONS[number]['title'];
