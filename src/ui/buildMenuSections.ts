import type { BuildingType } from '../core';

export const BUILDING_SECTIONS = [
  { title: 'build.housing', types: ['home'] },
  { title: 'build.production', types: ['workshop', 'factory', 'shop'] },
  { title: 'build.storage', types: ['storehouse', 'silo', 'vault'] },
  { title: 'build.utilities', types: ['powerPlant', 'waterTower', 'solar', 'battery', 'backup'] },
  { title: 'build.greenSpaces', types: ['tree', 'park'] },
  { title: 'build.transport', types: ['busStop', 'brtStation', 'railStation'] },
] as const satisfies readonly { title: string; types: readonly BuildingType[] }[];

export type BuildSection = typeof BUILDING_SECTIONS[number]['title'];
export const BUILD_SECTION_KEY = 'urbtopia-build-section';

export function readBuildSection(): BuildSection {
  try {
    const stored = localStorage.getItem(BUILD_SECTION_KEY);
    const section = BUILDING_SECTIONS.find(section => section.title === stored);
    return section?.title ?? BUILDING_SECTIONS[0].title;
  } catch {
    return BUILDING_SECTIONS[0].title;
  }
}

export function writeBuildSection(section: BuildSection): void {
  try {
    localStorage.setItem(BUILD_SECTION_KEY, section);
  } catch {
    return;
  }
}
