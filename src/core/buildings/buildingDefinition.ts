import type { NatureFamily } from '../environment/natureFamilies';
import type { BuildSection } from './buildSections';

export type AccessMode = 'road' | 'brt';

export interface LocalizedText {
  en: string;
  fr: string;
}

export interface BuildingDefinition {
  section?: BuildSection;
  model: string;
  footprint?: [number, number];
  cost?: number;
  unlockCitizens?: number;
  requiresRoad?: boolean;
  accessModes?: AccessMode[];
  initialSlots?: number;
  name: LocalizedText;
  description?: LocalizedText;
  sport?: { radius: number; wellbeingBonus: number };
  nature?: { family: NatureFamily };
}

export type BuildingDefinitions = Record<string, BuildingDefinition>;
