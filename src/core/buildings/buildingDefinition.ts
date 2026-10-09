import type { BuildingDefinition } from './buildingSchema.ts';

export type { BuildingDefinition } from './buildingSchema.ts';

export type AccessMode = 'road' | 'brt';

export interface LocalizedText {
  en: string;
  fr: string;
}

export type BuildingKind = BuildingDefinition['kind'];

type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type ValueInUnion<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? T[K] : never) : never;
type SharedKey = 'kind' | 'name';

// Every field of every kind, optional unless all kinds require it, so that code can read any field without narrowing on the kind.
export type FlatBuilding = Pick<BuildingDefinition, SharedKey> & {
  [K in Exclude<KeysOfUnion<BuildingDefinition>, SharedKey | '$schema'>]?: Exclude<ValueInUnion<BuildingDefinition, K>, undefined>;
};

export type BuildingDefinitions = Record<string, FlatBuilding>;
