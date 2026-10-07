import { NATURE_MODELS, type NatureType, type NatureFamily } from '../core/environment/nature';
import { BUILDING_SPECS, CROPS, CROP_IDS, ECOLOGY, ECOLOGY_UNLOCKS, FACILITY_TYPES, isCrop, maxTierOf, type BuildingType, type CropId, type FacilityType } from '../core';
import { SPORT_VENUE_TYPES, type SportVenueType } from '../core/leisure/sportVenues';
import { MESSAGES, type MessageKey } from '../i18n/messages';
import { FR } from '../i18n/fr';
import { BUILDING_SECTIONS, type BuildSection } from './buildingSections';
import { ROAD_CONSTRUCTIONS, type RoadConstructionId } from './construction';
import type { HomeColorVariant } from '../core';

export const HOME_COLOR_VARIANTS: readonly HomeColorVariant[] = ['default', 'a', 'b', 'c'];

export type CodexId = BuildingType | 'solarHome' | RoadConstructionId | CropId;
export type CodexSection = BuildSection | 'codex.roads' | 'codex.crops';

const DESCRIPTIONS = {
  ...Object.fromEntries(NATURE_MODELS.map(([type, , family]) => [type, `codex.description.nature.${family}`])) as Record<NatureType, `codex.description.nature.${NatureFamily}`>,
  ...Object.fromEntries(FACILITY_TYPES.map(type => [type, `codex.description.${type}`])) as Record<FacilityType, `codex.description.${FacilityType}`>,
  ...Object.fromEntries(SPORT_VENUE_TYPES.map(type => [type, `codex.description.${type}`])) as Record<SportVenueType, `codex.description.${SportVenueType}`>,
  home: 'codex.description.home',
  solarHome: 'codex.description.solarHome',
  workshop: 'codex.description.workshop',
  factory: 'codex.description.factory',
  shop: 'codex.description.shop',
  storehouse: 'codex.description.storehouse',
  silo: 'codex.description.silo',
  grainSilo: 'codex.description.grainSilo',
  vault: 'codex.description.vault',
  casino: 'codex.description.casino',
  farm: 'codex.description.farm',
  packhouse: 'codex.description.packhouse',
  powerPlant: 'codex.description.powerPlant',
  coalPlant: 'codex.description.coalPlant',
  waterTower: 'codex.description.waterTower',
  tree: 'codex.description.tree',
  park: 'codex.description.park',
  solar: 'codex.description.solar',
  battery: 'codex.description.battery',
  backup: 'codex.description.backup',
  busStop: 'codex.description.busStop',
  brtStation: 'codex.description.brtStation',
  railStation: 'codex.description.railStation',
  road: 'codex.description.road',
  crossing: 'codex.description.crossing',
  roundabout: 'codex.description.roundabout',
  brt: 'codex.description.brt',
  rail: 'codex.description.rail',
  ...Object.fromEntries(CROP_IDS.map(id => [id, 'codex.description.crop'])) as Record<CropId, 'codex.description.crop'>,
} as const satisfies Record<CodexId, MessageKey>;

export interface CodexEntry {
  id: CodexId;
  section: CodexSection;
  name: MessageKey;
  description: MessageKey;
  unlockCitizens: number;
  levels: readonly number[];
}

export interface CodexManifest {
  fingerprint: string;
  images: Record<string, string>;
}

const levelsOf = (type: BuildingType) => Array.from({ length: maxTierOf(type) }, (_, i) => i + 1);

export const CROP_CODEX_LEVELS: readonly number[] = [1, 2, 3, 4, 5];

const DECORATION_SECTION = 'build.decoration';
const GREEN_SPACES_SECTION = 'build.greenSpaces';

export const CODEX_SECTIONS: readonly CodexSection[] = [
  ...BUILDING_SECTIONS.map(section => section.title).filter(title => title !== DECORATION_SECTION && title !== GREEN_SPACES_SECTION),
  'codex.crops',
  'codex.roads',
  DECORATION_SECTION,
  GREEN_SPACES_SECTION,
];

export const CODEX_ENTRIES: readonly CodexEntry[] = [
  ...BUILDING_SECTIONS.flatMap(section => {
    const entries: CodexEntry[] = section.types.map(type => ({
      id: type, section: section.title, name: `building.${type}`, description: DESCRIPTIONS[type],
      unlockCitizens: ECOLOGY_UNLOCKS[type] ?? 0, levels: levelsOf(type),
    }));
    if (section.title === 'build.housing') entries.push({
      id: 'solarHome', section: section.title, name: 'eco.solarHome', description: DESCRIPTIONS.solarHome,
      unlockCitizens: ECOLOGY.solarUnlockCitizens, levels: levelsOf('home'),
    });
    return entries;
  }),
  ...CROP_IDS.map((id): CodexEntry => ({
    id, section: 'codex.crops', name: `item.${id}`, description: DESCRIPTIONS[id],
    unlockCitizens: CROPS[id].unlockCitizens, levels: CROP_CODEX_LEVELS,
  })),
  ...ROAD_CONSTRUCTIONS.map(item => ({
    id: item.id, section: 'codex.roads' as const, name: item.name, description: DESCRIPTIONS[item.id],
    unlockCitizens: item.unlockCitizens, levels: [1],
  })),
];

export function codexImageKey(id: CodexId, level: number, colorVariant?: HomeColorVariant): string {
  const key = `${id}:${level}`;
  if (id !== 'home' && id !== 'solarHome') return key;
  return `${key}:${colorVariant ?? 'default'}`;
}

export function validateCodex(entries: readonly CodexEntry[] = CODEX_ENTRIES): void {
  const expected = [...Object.keys(BUILDING_SPECS), 'solarHome', ...ROAD_CONSTRUCTIONS.map(item => item.id), ...CROP_IDS];
  if (entries.length !== expected.length || expected.some(id => entries.filter(entry => entry.id === id).length !== 1)) {
    throw new Error('Every constructible must have exactly one codex entry');
  }
  for (const entry of entries) {
    if (!CODEX_SECTIONS.includes(entry.section)) throw new Error(`Missing codex section: ${entry.id}`);
    for (const key of [entry.name, entry.section, entry.description]) {
      if (!MESSAGES[key]?.trim() || !FR[key]?.trim()) throw new Error(`Missing codex translation: ${key}`);
    }
    const buildingType = entry.id === 'solarHome' ? 'home' : entry.id;
    const levels = buildingType in BUILDING_SPECS ? levelsOf(buildingType as BuildingType) : isCrop(entry.id) ? CROP_CODEX_LEVELS : [1];
    if (JSON.stringify(entry.levels) !== JSON.stringify(levels)) throw new Error(`Missing codex levels: ${entry.id}`);
    if (!Number.isInteger(entry.unlockCitizens) || entry.unlockCitizens < 0) throw new Error(`Invalid codex unlock: ${entry.id}`);
  }
}

export function validateCodexManifest(manifest: CodexManifest): void {
  validateCodex();
  if (!manifest.fingerprint || !manifest.images) throw new Error('Invalid codex manifest');
  for (const entry of CODEX_ENTRIES) {
    for (const level of entry.levels) {
      const variants = entry.id === 'home' || entry.id === 'solarHome' ? HOME_COLOR_VARIANTS : [undefined];
      for (const colorVariant of variants) {
        const image = manifest.images[codexImageKey(entry.id, level, colorVariant)];
        if (!image || !/^[a-zA-Z0-9-]+\.png$/.test(image)) throw new Error(`Missing codex image: ${entry.id}, level ${level}, color ${colorVariant ?? 'default'}`);
      }
    }
  }
}
