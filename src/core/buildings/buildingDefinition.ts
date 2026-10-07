import type { NatureFamily } from '../environment/natureFamilies';

export interface LocalizedText {
  en: string;
  fr: string;
}

export interface SportBuildingDefinition {
  kind: 'sport';
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  unlockCitizens: number;
  cost: number;
  radius: number;
  wellbeingBonus: number;
}

export interface NatureBuildingDefinition {
  kind: 'nature';
  id: string;
  family: NatureFamily;
  name: LocalizedText;
}

export type BuildingDefinition = SportBuildingDefinition | NatureBuildingDefinition;
