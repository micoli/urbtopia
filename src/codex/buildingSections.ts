import type { BuildingType } from '../core';

export const BUILDING_SECTIONS = [
  { title: 'build.housing', types: ['home'] },
  { title: 'build.production', types: ['workshop', 'factory', 'shop'] },
  { title: 'build.storage', types: ['storehouse', 'silo', 'vault'] },
  { title: 'build.utilities', types: ['powerPlant', 'coalPlant', 'waterTower', 'solar', 'battery', 'backup'] },
  { title: 'build.greenSpaces', types: ['tree', 'park'] },
  { title: 'build.transport', types: ['busStop', 'brtStation', 'railStation'] },
] as const satisfies readonly { title: string; types: readonly BuildingType[] }[];

export type BuildSection = typeof BUILDING_SECTIONS[number]['title'];
